import pandas as pd
import numpy as np
import os
import re

# --- Configuration (Based on your confirmed structure) ---
RAW_DATA_FOLDER = 'DATA_RAW'
CLEANED_DATA_FOLDER = 'DIET_DATA_PROCESSED'
RAW_FILE_NAME = 'Anuvaad_INDB_2024.11.csv' # 📢 Check and update this exact filename if needed
CLEANED_FILE_NAME = 'cleaned_indian_recipes_for_ml.csv'

# List of common encodings to try for robust file reading
COMMON_ENCODINGS = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']

# --- TAGGING HELPER FUNCTIONS ---

def tag_food_attributes(food_name, ingredients_list=""):
    """
    Tags a recipe with various categorical flags based on keywords.
    Returns a dictionary of tags.
    """
    name = str(food_name).lower()
    text_to_check = name + " " + str(ingredients_list).lower()
    
    tags = {}
    
    # --- 1. Veg/NonVeg Tagging (Mandatory) ---
    non_veg_keywords = ['chicken', 'mutton', 'fish', 'prawn', 'egg', 'beef', 'pork', 'lamb']
    tags['veg_nonveg_flag'] = 1 if any(kw in text_to_check for kw in non_veg_keywords) else 0

    # --- 2. Regional Tagging (Essential for Planner) ---
    if any(kw in name for kw in ['dosa', 'sambar', 'rasam', 'idli', 'appam', 'vada', 'uttapam']):
        tags['Region'] = 'South'
    elif any(kw in name for kw in ['paratha', 'chole', 'naan', 'rogan', 'dal makhani', 'rajma', 'aloo gobi']):
        tags['Region'] = 'North'
    elif any(kw in name for kw in ['rasgulla', 'mishti', 'dhokla', 'khandvi', 'thepla']):
        tags['Region'] = 'East/West' # Grouping simplified regions
    else:
        tags['Region'] = 'General'

    # --- 3. Processed/Unhealthy/Trigger Tags (CRITICAL for Meno/PCOS Filtering) ---
    # These flags filter out the 'cake', 'manchurian' type meals you identified.
    tags['is_processed_flag'] = 1 if any(kw in name for kw in ['manchurian', 'cutlet', 'burger', 'pizza', 'fritti', 'noodles', 'cake']) else 0
    tags['is_spicy_flag'] = 1 if any(kw in text_to_check for kw in ['mirch', 'chili', 'masala', 'garam masala', 'teekha']) else 0
    tags['contains_dairy_flag'] = 1 if any(kw in text_to_check for kw in ['milk', 'paneer', 'curd', 'dahi', 'ghee', 'cheese']) else 0
    
    # Meal Type Tagging (Mandatory for Scheduling)
    if any(kw in name for kw in ['tea', 'coffee', 'oats', 'upma', 'poha']):
        tags['Meal_Type'] = 'Breakfast'
    elif any(kw in name for kw in ['rice', 'roti', 'dal', 'sabzi', 'curry']):
        tags['Meal_Type'] = 'Lunch/Dinner' # Will be split later
    else:
        tags['Meal_Type'] = 'Snacks/Dessert'

    return tags

# --- MAIN PREPROCESSING FUNCTION ---

def preprocess_and_clean_recipe_data(raw_file_path, cleaned_output_path):
    """
    Loads raw INDB data, adds necessary tags, selects features, cleans, 
    and engineers health-relevant ratios.
    """
    print(f"Loading raw data from: {raw_file_path}")
    df_raw = None
    
    # 1. Robust File Loading with Encoding Fallback
    for encoding in COMMON_ENCODINGS:
        try:
            # We assume it's a CSV based on the provided data structure
            df_raw = pd.read_csv(raw_file_path, low_memory=False, encoding=encoding)
            print(f"✅ Data loaded successfully using {encoding}.")
            break 
            
        except UnicodeDecodeError:
            continue
        except Exception as e:
            print(f"❌ Error during file reading with {encoding}: {e}")
            return
    
    if df_raw is None:
        print("❌ Final Error: Could not read file. Check file integrity or manual save.")
        return

    # 2. Add Critical Tagging Features (Region, Meal Type, Veg/NonVeg, Health Flags)
    # Apply the tagging function row-wise
    tag_results = df_raw.apply(lambda row: tag_food_attributes(row['food_name']), axis=1, result_type='expand')
    df_raw = pd.concat([df_raw, tag_results], axis=1)
    print("✅ Added regional, meal type, and health tags.")

    # 3. Handle Meal Type Ambiguity (Split Lunch/Dinner)
    # Since INDB doesn't strictly label, we split the combined category randomly for variety:
    lunch_dinner_indices = df_raw[df_raw['Meal_Type'] == 'Lunch/Dinner'].index
    split_count = len(lunch_dinner_indices) // 2
    
    df_raw.loc[lunch_dinner_indices[:split_count], 'Meal_Type'] = 'Lunch'
    df_raw.loc[lunch_dinner_indices[split_count:], 'Meal_Type'] = 'Dinner'
    # Relabel Snacks/Dessert items
    df_raw.loc[df_raw['Meal_Type'] == 'Snacks/Dessert', 'Meal_Type'] = np.random.choice(['Evening Snacks', 'Dessert'], size=len(df_raw[df_raw['Meal_Type'] == 'Snacks/Dessert']))

    # 4. Feature Selection Strategy
    FEATURES_TO_KEEP = [
        'food_code', 'food_name', 'servings_unit', 
        'veg_nonveg_flag', 'Region', 'Meal_Type', 'is_processed_flag', 'is_spicy_flag', 
        'contains_dairy_flag', # 📢 ADDED TAGS
        
        # Core Nutrients (Per Serving)
        'unit_serving_energy_kcal', 'unit_serving_carb_g', 'unit_serving_protein_g',
        'unit_serving_fat_g', 'unit_serving_freesugar_g', 'unit_serving_fibre_g', 
        'unit_serving_sfa_mg', 'unit_serving_mufa_mg', 'unit_serving_pufa_mg',  
        
        # Key Meno/PCOS Micros
        'unit_serving_calcium_mg', 'unit_serving_iron_mg', 'unit_serving_magnesium_mg',  
        'unit_serving_sodium_mg', 'unit_serving_potassium_mg', 'unit_serving_zinc_mg',       
        'unit_serving_vita_ug', 'unit_serving_folate_ug', 'unit_serving_vitc_mg',
    ]

    existing_features = [f for f in FEATURES_TO_KEEP if f in df_raw.columns]
    df_cleaned = df_raw[existing_features].copy()

    # 5. Cleaning and Renaming
    df_cleaned.fillna(0, inplace=True) 

    new_column_names = {
        col: col.replace('unit_serving_', '').replace('_ug', '_mcg')
        for col in df_cleaned.columns
    }
    df_cleaned.rename(columns=new_column_names, inplace=True)
    
    # 6. Feature Engineering (Health Ratios)
    EPSILON = 0.001 
    
    if 'carb_g' in df_cleaned.columns and 'fibre_g' in df_cleaned.columns:
        df_cleaned['carb_to_fibre_ratio'] = df_cleaned['carb_g'] / (df_cleaned['fibre_g'].replace(0, EPSILON))
        
    if 'protein_g' in df_cleaned.columns and 'carb_g' in df_cleaned.columns:
        df_cleaned['protein_to_carb_ratio'] = df_cleaned['protein_g'] / (df_cleaned['carb_g'].replace(0, EPSILON))

    if all(c in df_cleaned.columns for c in ['mufa_mg', 'pufa_mg', 'sfa_mg']):
        df_cleaned['unsat_to_sat_fat_ratio'] = (df_cleaned['mufa_mg'] + df_cleaned['pufa_mg']) / \
                                              (df_cleaned['sfa_mg'].replace(0, EPSILON))
    
    # 7. Final Output & Save
    os.makedirs(os.path.dirname(cleaned_output_path), exist_ok=True)
    df_cleaned.to_csv(cleaned_output_path, index=False)
    
    print("\n✅ Preprocessing complete.")
    print(f"✅ Cleaned data saved to: {cleaned_output_path}")
    print(f"Total rows in final dataset: {len(df_cleaned)}")
    print(f"Final columns: {list(df_cleaned.columns)}")
    
    return df_cleaned

if __name__ == '__main__':
    # Determine the absolute path of the directory containing the current script (ML_PIPELINE)
    script_dir = os.path.dirname(os.path.abspath(__file__)) 
    project_root = os.path.dirname(script_dir)
    
    RAW_DATA_PATH = os.path.join(project_root, RAW_DATA_FOLDER, RAW_FILE_NAME)
    CLEANED_DATA_PATH = os.path.join(project_root, CLEANED_DATA_FOLDER, CLEANED_FILE_NAME)
    
    print(f"Attempting to load data from (Absolute Path): {RAW_DATA_PATH}")
    preprocess_and_clean_recipe_data(RAW_DATA_PATH, CLEANED_DATA_PATH)