import pandas as pd
import numpy as np
import re
import os
from io import StringIO

# --- Define Constants based on Project Structure ---
RAW_DATA_PATH = os.path.join('..', 'DATA_RAW', 'Formdata.csv')
PROCESSED_OUTPUT_DIR = os.path.join('..', 'ONBOARDING_DATA_PROCESSED')
OUTPUT_FILENAME = 'cleaned_onboarding_data.csv'

# --- Fallback Data String (Used if Formdata.csv is not found) ---
# NOTE: 20 new rows added for diversity and higher severity representation.
FALLBACK_DATA_STRING = """Timestamp,Age group,Weight range (kg),Height range (cm),Exercise frequency,Average cycle length,Cycle regularity (past 12 months),Flow intensity (usual),Skipped periods (past 12 months),Self-reported stage,Hot flashes severity ,Night sweats severity,Mood swings severity,Sleep disturbances severity,Fatigue severity,Brain fog / memory issues severity,Average sleep per night,Stress level (past 3 months),Caffeine intake,Screen time per day,"Do you avoid any of these foods? (Select all that apply)
",Dietary preferences / goals (Select all that apply),Water intake per day,Irregular periods frequency,Hair growth on face/body ,Acne severity,Weight gain / belly fat ,Mood swings / irritability,Fatigue,Foods that worsen symptoms,Exercise type,Add remedies often used for PCOS,Column 32,Column 33,Column 34
9-14-2025 16:08:47,45-49,60-69,150-159,3-4 times/week,24-28 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",0,0,1,0,1,0,7-8 hours,Moderate,None,5-7 hours,Seafood,"High protein, Calcium rich, Omega 3 rich",3+L,Rare (<1/month),0,0,2,1,0,Fried foods,Yoga,Fenugreek seeds,,,
9-17-2025 12:51:30,30-39,50-59,<150,Rarely / None,<24 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",4,3,5,5,0,2,<5 hours,High,Moderate (2-3 cups/day),8+ hours,None,Calcium rich,1-2L,Rare (<1/month),0,5,5,,,Fried foods,None,Turmeric milk,,,
9-17-2025 13:16:56,45-49,50-59,150-159,Rarely / None,24-28 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",0,0,2,2,1,0,7-8 hours,Moderate,None,2-4 hours,None,"High protein, Calcium rich",<1L,Rare (<1/month),0,0,2,,,None,None,Turmeric milk,,,
9-17-2025 13:42:24,18- 29,70-79,170-179,Daily,24-28 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",0,1,3,2,1,0,5-6 hours,Moderate,Low (1 cup/day),2-4 hours,Seafood,Iron rich,2-3L,Rare (<1/month),0,0,1,,,Dairy,Cardio,Turmeric milk,,,
9-17-2025 13:43:10,18- 29,50-59,160-169,Daily,29-35 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",0,0,2,1,3,2,5-7 hours,High,Low (1 cup/day),5-7 hours,None,"High protein, Iron rich, Omega 3 rich",2-3L,Rare (<1/month),1,1,0,,,Fried foods,Cardio,Fenugreek seeds,,,
9-17-2025 13:58:51,18- 29,<50,160-169,3-4 times/week,35 days,Regular,Light,0 months,"Premenopause (regular cycles, no symptoms)",0,1,2,2,2,0,7-8 hours,Moderate,None,2-4 hours,Dairy,High protein,1-2L,Rare (<1/month),0,0,0,,,Fried foods,Cardio,Fenugreek seeds,,,
9-17-2025 14:47:46,18- 29,50-59,<150,3-4 times/week,29-35 days,Regular,Medium,1-3 months,"Premenopause (regular cycles, no symptoms)",0,1,1,1,1,0,7-8 hours,Low,Low (1 cup/day),5-7 hours,"Soy, Seafood",High protein,<1L,Rare (<1/month),0,0,1,,,Dairy,Cardio,Turmeric milk,,,
9-17-2025 14:51:37,45-49,50-59,150-159,Daily,Not applicable (no periods),Irregular,Medium,1-3 months,"Perimenopause (irregular cycles, symptoms starting)",2,1,2,2,2,2,7-8 hours,Moderate,None,5-7 hours,Seafood,High protein,<1L,Frequent (>3/month),1,0,0,,,High sugar,Yoga,Turmeric milk,,,
9-17-2025 20:32:25,45-49,70-79,150-159,Rarely / None,24-28 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",0,0,1,1,1,0,7-8 hours,Moderate,None,2-4 hours,Seafood,Low glycemic index,3+L,Rare (<1/month),0,0,0,,,None,None,Turmeric milk,,,
9-17-2025 20:52:56,18- 29,70-79,150-159,1-2 times/week,24-28 days,Regular,Heavy,0 months,Unknown,0,3,4,4,4,0,5-6 hours,High,Low (1 cup/day),5-7 hours,None,High protein,2-3L,Rare (<1/month),0,2,4,,,Fried foods,Cardio,Cinnamon water,,,
9-17-2025 21:23:27,50-54,50-59,150-159,1-2 times/week,<24 days,Irregular,Light,4-6 months,"Perimenopause (irregular cycles, symptoms starting)",0,0,0,0,0,0,7-8 hours,Low,None,2-4 hours,None,"High protein, Low glycemic index, Iron rich, Calcium rich, Omega 3 rich",1-2L,Occasional (1-3/month),0,0,0,,,None,Cardio,Turmeric milk,,,
9-17-2025 21:24:54,45-49,70-79,160-169,Rarely / None,Not applicable (no periods),No periods,Heavy,12+ months,Menopause (no period for 12 months),5,3,3,2,0,3,9+ hours,High,High (4+ cups/day),2-4 hours,"Dairy, Seafood",Iron rich,<1L,Frequent (>3/month),0,0,3,,,None,None,Fenugreek seeds,,,
9-17-2025 21:28:19,55-59,<50,150-159,Daily,<24 days,Regular,Medium,0 months,"Perimenopause (irregular cycles, symptoms starting)",1,1,2,2,3,3,5-6 hours,High,Moderate (2-3 cups/day),8+ hours,"Gluten, Seafood","High protein, Low glycemic index, Iron rich, Calcium rich, Omega 3 rich",1-2L,Rare (<1/month),0,1,1,,,None,Yoga,Turmeric milk,,,
9-17-2025 21:58:04,30-39,70-79,150-159,Daily,24-28 days,Regular,Heavy,0 months,Unknown,2,0,5,4,0,4,5-6 hours,High,Moderate (2-3 cups/day),2-4 hours,Gluten,High protein,1-2L,Rare (<1/month),1,3,3,,,Fried foods,Yoga,Turmeric milk,,,
9-17-2025 22:33:20,40-44,60-69,150-159,1-2 times/week,24-28 days,Regular,Medium,0 months,"Perimenopause (irregular cycles, symptoms starting)",0,0,2,2,2,1,5-6 hours,High,None,2-4 hours,"Soy, Seafood","High protein, Low glycemic index, Iron rich",1-2L,Rare (<1/month),0,0,2,,,None,None,Fenugreek seeds,,,
9-17-2025 22:50:54,30-39,50-59,150-159,Rarely / None,24-28 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",0,0,2,5,0,0,<5 hours,Moderate,Low (1 cup/day),<2 hours,Gluten,High protein,<1L,Rare (<1/month),5,0,3,,,Fried foods,None,Turmeric milk,,,
9-17-2025 23:00:56,18- 29,50-59,150-159,1-2 times/week,24-28 days,Regular,Medium,0 months,Unknown,1,1,1,2,1,0,5-6 hours,Moderate,Low (1 cup/day),2-4 hours,None,"High protein, Low glycemic index, Iron rich, Calcium rich, Omega 3 rich",1-2L,Rare (<1/month),1,0,2,,,None,None,Turmeric milk,,,
9-17-2025 23:16:42,50-54,60-69,150-159,1-2 times/week,24-28 days,Irregular,Heavy,1-3 months,"Perimenopause (irregular cycles, symptoms starting)",2,2,4,4,2,2,5-6 hours,Moderate,Moderate (2-3 cups/day),2-4 hours,"Soy, Seafood","Iron rich, Calcium rich, Omega 3 rich",1-2L,Frequent (>3/month),2,0,2,,,None,Yoga,Turmeric milk,,,
9-17-2025 23:32:18,50-54,80+,160-169,3-4 times/week,Not applicable (no periods),No periods,Medium,12+ months,Postmenopause (more than 12 months without periods),3,3,3,1,3,3,7-8 hours,Moderate,Low (1 cup/day),8+ hours,None,"High protein, Low glycemic index, Iron rich, Calcium rich, Omega 3 rich",2-3L,Rare (<1/month),0,0,3,,,None,Yoga,Aloe vera juice,,,
9-17-2025 23:36:08,45-49,60-69,150-159,Daily,24-28 days,Regular,Medium,0 months,"Perimenopause (irregular cycles, symptoms starting)",1,4,2,1,2,2,5-6 hours,Low,Low (1 cup/day),5-7 hours,None,Low glycemic index,2-3L,Rare (<1/month),0,0,1,,,None,Yoga,Cinnamon water,,,
9-17-2025 23:53:11,18- 29,50-59,150-159,Rarely / None,24-28 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",4,1,5,4,4,3,5-6 hours,Moderate,None,8+ hours,"Soy, Seafood","High protein, Iron rich, Calcium rich",1-2L,Rare (<1/month),4,2,3,,,High sugar,None,Fenugreek seeds,,,
9-18-2025 1:27:07,40-44,70-79,150-159,3-4 times/week,24-28 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",2,2,3,2,4,3,5-6 hours,Low,Moderate (2-3 cups/day),2-4 hours,Seafood,"High protein, Calcium rich",1-2L,Rare (<1/month),3,0,2,,,None,Strength training,Cinnamon water,,,
9-18-2025 8:00:46,40-44,70-79,150-159,3-4 times/week,29-35 days,Regular,Light,0 months,Unknown,0,0,1,0,2,3,5-6 hours,Low,None,2-4 hours,"Soy, Seafood","High protein, Low glycemic index, Iron rich, Calcium rich, Omega 3 rich",2-3L,Rare (<1/month),1,0,5,,,High sugar,Yoga,Fenugreek seeds,,,
9-18-2025 8:07:58,40-44,70-79,160-169,Daily,<24 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",0,0,0,0,0,0,5-6 hours,Low,Moderate (2-3 cups/day),2-4 hours,"Dairy, Seafood","High protein, Iron rich, Calcium rich",2-3L,Rare (<1/month),1,0,1,,,None,Yoga,Turmeric milk,,,
9-18-2025 8:11:13,40-44,70-79,160-169,3-4 times/week,<24 days,Regular,Light,0 months,"Premenopause (regular cycles, no symptoms)",0,0,0,0,0,0,5-6 hours,Low,Moderate (2-3 cups/day),2-4 hours,"Dairy, Seafood","High protein, Iron rich, Calcium rich",2-3L,Rare (<1/month),0,0,1,,,Fried foods,Yoga,Turmeric milk,,,
9-18-2025 8:39:52,30-39,50-59,150-159,Daily,24-28 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",0,0,3,1,1,1,5-6 hours,Moderate,Low (1 cup/day),<2 hours,Seafood,Iron rich,1-2L,Rare (<1/month),0,1,0,,,None,Yoga,Turmeric milk,,,
9-18-2025 9:33:39,40-44,<50,150-159,3-4 times/week,24-28 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",0,1,2,1,4,0,7-8 hours,Low,Low (1 cup/day),2-4 hours,None,"High protein, Iron rich, Calcium rich",3+L,Rare (<1/month),0,0,0,,,None,Yoga,Cinnamon water,,,
9-18-2025 10:17:12,45-49,60-69,160-169,Daily,24-28 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",1,1,1,1,0,0,7-8 hours,Low,None,<2 hours,None,High protein,2-3L,Rare (<1/month),1,1,1,,,Fried foods,Cardio,Turmeric milk,,,
9-18-2025 10:24:29,45-49,50-59,150-159,1-2 times/week,24-28 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",1,2,3,3,4,3,5-6 hours,High,Low (1 cup/day),8+ hours,"Gluten, Soy, Seafood","High protein, Iron rich, Calcium rich, Omega 3 rich",<1L,Rare (<1/month),0,0,1,,,None,Yoga,Fenugreek seeds,,,
9-18-2025 10:46:52,45-49,60-69,150-159,Rarely / None,24-28 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",0,0,0,0,0,0,7-8 hours,Low,None,2-4 hours,None,"High protein, Calcium rich",1-2L,Rare (<1/month),0,0,1,,,None,Yoga,Fenugreek seeds,,,
9-18-2025 11:13:46,30-39,50-59,150-159,3-4 times/week,24-28 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",0,0,0,0,0,1,5-6 hours,Moderate,None,<2 hours,"Soy, Seafood","High protein, Low glycemic index, Iron rich, Calcium rich, Omega 3 rich",2-3L,Rare (<1/month),0,1,1,,,High sugar,Yoga,Aloe vera juice,,,
9-18-2025 11:22:36,45-49,<50,<150,3-4 times/week,24-28 days,Regular,Light,0 months,"Premenopause (regular cycles, no symptoms)",0,0,1,1,2,2,5-6 hours,Moderate,Low (1 cup/day),<2 hours,None,Iron rich,2-3L,Rare (<1/month),0,0,0,,,Fried foods,Yoga,Aloe vera juice,,,
9-18-2025 11:42:33,30-39,70-79,170-179,3-4 times/week,24-28 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",0,0,0,0,0,0,5-6 hours,Moderate,Moderate (2-3 cups/day),2-4 hours,Dairy,High protein,3+L,Rare (<1/month),0,1,3,,,Fried foods,Cardio,Fenugreek seeds,,,
9-18-2025 11:50:37,45-49,60-69,150-159,Daily,35 days,Irregular,Medium,1-3 months,"Perimenopause (irregular cycles, symptoms starting)",0,0,1,1,0,1,7-8 hours,Low,None,2-4 hours,"Soy, None","High protein, Low glycemic index, Omega 3 rich",<1L,Frequent (>3/month),0,1,1,,,High sugar,Strength training,Cinnamon water,,,
9-18-2025 11:51:45,45-49,50-59,150-159,3-4 times/week,29-35 days,Irregular,Heavy,4-6 months,"Perimenopause (irregular cycles, symptoms starting)",2,1,3,3,2,3,5-6 hours,Moderate,Low (1 cup/day),<2 hours,Gluten,Calcium rich,1-2L,Frequent (>3/month),4,4,5,,,Fried foods,Yoga,Aloe vera juice,,,
9-18-2025 12:12:43,45-49,50-59,150-159,3-4 times/week,24-28 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",0,0,0,0,1,0,5-6 hours,Moderate,None,2-4 hours,None,High protein,2-3L,Rare (<1/month),0,0,1,,,None,Strength training,Turmeric milk,,,
9-18-2025 12:18:51,30-39,60-69,150-159,Rarely / None,29-35 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",0,0,3,3,3,4,7-8 hours,Moderate,None,5-7 hours,"Soy, Seafood","High protein, Low glycemic index, Iron rich, Calcium rich, Omega 3 rich",2-3L,Rare (<1/month),2,2,4,,,Fried foods,Yoga,Turmeric milk,,,
9-18-2025 12:47:58,40-44,<50,150-159,3-4 times/week,24-28 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",0,0,1,1,1,0,5-6 hours,Moderate,Low (1 cup/day),2-4 hours,Dairy,"High protein, Iron rich, Calcium rich, Omega 3 rich",3+L,Rare (<1/month),0,0,0,,,None,Yoga,Fenugreek seeds,,,
9-18-2025 13:45:01,30-39,60-69,<150,1-2 times/week,24-28 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",0,0,1,0,1,0,7-8 hours,Moderate,None,2-4 hours,"Soy, Seafood","High protein, Calcium rich",2-3L,Rare (<1/month),0,0,1,,,High sugar,Cardio,Aloe vera juice,,,
9-18-2025 13:49:02,18- 29,60-69,160-169,3-4 times/week,29-35 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",0,0,3,0,2,0,7-8 hours,Moderate,Low (1 cup/day),2-4 hours,None,"High protein, Low glycemic index, Iron rich, Calcium rich, Omega 3 rich",1-2L,Rare (<1/month),1,0,0,,,None,Cardio,Turmeric milk,,,
9-18-2025 13:50:47,45-49,60-69,150-159,3-4 times/week,24-28 days,Irregular,Medium,1-3 months,"Perimenopause (irregular cycles, symptoms starting)",2,1,3,3,4,4,7-8 hours,High,Moderate (2-3 cups/day),2-4 hours,Gluten,Low glycemic index,1-2L,Occasional (1-3/month),0,3,3,,,High sugar,Yoga,Cinnamon water,,,
9-18-2025 14:41:54,45-49,60-69,150-159,3-4 times/week,29-35 days,Irregular,Medium,0 months,Unknown,0,0,2,0,0,3,5-6 hours,Moderate,Moderate (2-3 cups/day),<2 hours,"Gluten, Seafood","High protein, Iron rich, Omega 3 rich",1-2L,Rare (<1/month),0,0,5,,,Fried foods,Yoga,Turmeric milk,,,
9-18-2025 14:44:05,45-49,60-69,150-159,3-4 times/week,29-35 days,Irregular,Medium,1-3 months,Unknown,0,0,2,0,0,5,5-6 hours,Moderate,Moderate (2-3 cups/day),<2 hours,"Gluten, Seafood, None","High protein, Iron rich, Omega 3 rich",2-3L,Rare (<1/month),0,0,4,,,Fried foods,Yoga,Turmeric milk,,,
9-18-2025 14:51:02,55-59,60-69,150-159,Daily,Not applicable (no periods),No periods,Light,0 months,Postmenopause (more than 12 months without periods),0,0,0,0,2,1,5-6 hours,Low,Low (1 cup/day),<2 hours,Seafood,Low glycemic index,1-2L,Rare (<1/month),1,0,0,,,High sugar,Yoga,Turmeric milk,,,
9-18-2025 15:03:03,50-54,70-79,160-169,3-4 times/week,35 days,Irregular,Medium,4-6 months,"Perimenopause (irregular cycles, symptoms starting)",4,2,5,5,4,4,<5 hours,High,Moderate (2-3 cups/day),8+ hours,"Dairy, Soy, Seafood",High protein,3+L,Occasional (1-3/month),0,0,3,,,Fried foods,Cardio,Cinnamon water,,,
9-18-2025 15:36:25,40-44,50-59,150-159,3-4 times/week,24-28 days,Regular,Light,0 months,"Premenopause (regular cycles, no symptoms)",0,0,0,0,2,0,7-8 hours,Moderate,None,<2 hours,"Dairy, Gluten, Soy, Seafood","Low glycemic index, Iron rich",2-3L,Rare (<1/month),0,0,1,,,High sugar,Yoga,Cinnamon water,,,
9-18-2025 15:56:25,45-49,60-69,150-159,Rarely / None,24-28 days,Regular,Heavy,0 months,"Premenopause (regular cycles, no symptoms)",0,0,0,0,0,0,<5 hours,Low,None,<2 hours,None,"High protein, Iron rich, Calcium rich, Omega 3 rich",1-2L,Rare (<1/month),0,0,0,,,None,None,Fenugreek seeds,,,
9-18-2025 16:14:14,30-39,60-69,<150,Rarely / None,24-28 days,Regular,Medium,0 months,Unknown,0,1,2,1,0,1,5-6 hours,High,Moderate (2-3 cups/day),<2 hours,None,Iron rich,1-2L,Rare (<1/month),0,2,3,,,High sugar,None,Cinnamon water,,,
9-18-2025 19:12:47,45-49,50-59,150-159,3-4 times/week,29-35 days,Irregular,Medium,1-3 months,"Perimenopause (irregular cycles, symptoms starting)",2,1,2,1,2,0,5-6 hours,High,None,<2 hours,None,"Iron rich, Calcium rich",2-3L,Occasional (1-3/month),0,0,0,,,Fried foods,Yoga,Turmeric milk,,,
9-18-2025 19:16:26,45-49,60-69,160-169,Rarely / None,Not applicable (no periods),Irregular,Medium,1-3 months,"Perimenopause (irregular cycles, symptoms starting)",3,3,3,4,2,2,5-6 hours,Moderate,Low (1 cup/day),2-4 hours,None,High protein,2-3L,Occasional (1-3/month),0,0,0,,,None,None,Turmeric milk,,,
9-18-2025 19:26:28,45-49,60-69,150-159,3-4 times/week,24-28 days,Irregular,Heavy,0 months,"Perimenopause (irregular cycles, symptoms starting)",1,1,1,1,1,1,7-8 hours,Low,Low (1 cup/day),8+ hours,None,"Iron rich, Omega 3 rich",1-2L,Occasional (1-3/month),0,2,4,,,None,Yoga,Fenugreek seeds,,,
9-18-2025 19:47:13,45-49,60-69,160-169,3-4 times/week,24-28 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",0,0,1,1,1,0,5-6 hours,Moderate,Moderate (2-3 cups/day),2-4 hours,Seafood,"High protein, Low glycemic index, Iron rich, Calcium rich, Omega 3 rich",1-2L,Rare (<1/month),1,2,1,,,High sugar,Cardio,Cinnamon water,,,
9-18-2025 20:25:56,40-44,60-69,150-159,Rarely / None,35 days,Irregular,Medium,4-6 months,"Perimenopause (irregular cycles, symptoms starting)",1,0,2,2,3,3,5-6 hours,High,Moderate (2-3 cups/day),<2 hours,None,"High protein, Calcium rich",1-2L,Frequent (>3/month),0,0,3,,,None,None,Turmeric milk,,,
9-19-2025 9:35:49,45-49,70-79,150-159,1-2 times/week,29-35 days,Irregular,Heavy,1-3 months,"Perimenopause (irregular cycles, symptoms starting)",3,3,3,3,3,5,<5 hours,Moderate,Low (1 cup/day),<2 hours,Dairy,"High protein, Low glycemic index",2-3L,Occasional (1-3/month),2,0,4,,,High sugar,Cardio,Fenugreek seeds,,,
9-19-2025 10:09:36,60+,50-59,150-159,Daily,Not applicable (no periods),No periods,Light,0 months,Postmenopause (more than 12 months without periods),0,0,0,0,0,0,5-6 hours,Low,None,2-4 hours,"Dairy, Soy, Seafood","Iron rich, Calcium rich",1-2L,Frequent (>3/month),1,1,5,,,High sugar,Yoga,Fenugreek seeds,,,
9-19-2025 17:04:18,45-49,50-59,<150,Daily,35 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",0,0,0,0,0,0,5-6 hours,Moderate,None,<2 hours,Gluten,Calcium rich,2-3L,Rare (<1/month),1,0,1,,,None,Yoga,Turmeric milk,,,
9-21-2025 22:18:36,18- 29,<50,150-159,3-4 times/week,24-28 days,Regular,Medium,0 months,Unknown,0,1,3,2,0,1,7-8 hours,Moderate,None,8+ hours,None,"High protein, Iron rich",2-3L,Rare (<1/month),2,1,0,,,None,Yoga,Turmeric milk,,,
9-21-2025 23:45:28,18- 29,80+,150-159,1-2 times/week,35 days,Irregular,Heavy,1-3 months,"Perimenopause (irregular cycles, symptoms starting)",2,1,2,3,2,3,5-6 hours,High,Low (1 cup/day),8+ hours,None,High protein,2-3L,Occasional (1-3/month),4,2,5,,,High sugar,Cardio,Fenugreek seeds,,,
9-22-2025 7:49:28,30-39,50-59,150-159,Rarely / None,24-28 days,Regular,Medium,0 months,Unknown,0,0,3,0,0,0,5-6 hours,Moderate,Moderate (2-3 cups/day),8+ hours,Seafood,"High protein, Iron rich, Calcium rich, Omega 3 rich",2-3L,Rare (<1/month),0,0,0,,,None,None,Fenugreek seeds,,,
9-22-2025 18:47:23,18- 29,50-59,150-159,3-4 times/week,29-35 days,Regular,Medium,0 months,"Premenopause (regular cycles, no symptoms)",2,1,3,2,3,0,7-8 hours,Moderate,Low (1 cup/day),2-4 hours,Seafood,"Iron rich, Calcium rich",2-3L,Rare (<1/month),3,4,3,,,None,Cardio,Fenugreek seeds,,,
9-25-2025 4:46:37,18- 29,50-59,150-159,Rarely / None,29-35 days,Regular,Light,0 months,"Premenopause (regular cycles, no symptoms)",3,0,2,2,3,2,7-8 hours,High,Low (1 cup/day),8+ hours,Seafood,"High protein, Low glycemic index, Iron rich, Calcium rich, Omega 3 rich",<1L,Rare (<1/month),3,0,2,,,Fried foods,None,Fenugreek seeds,,,
01-09-2025 08:00,30-39,60-69,160-169,3-4 times/week,24-28 days,Regular,Medium,0 months,Perimenopause,1,0,2,1,3,2,6-7 hrs,Low,Low,5-7 hrs,Dairy,High protein,2-3L,Rare,1,2,1,3,1,Fried foods,Yoga,Turmeric milk,,,
01-09-2025 08:03,45-49,70-79,170-179,Rarely / None,Not applicable,No periods,Light,6+ months,Postmenopause,4,3,2,4,2,3,7-8 hrs,High,High,8+ hrs,None,Iron rich,3L,Occasional,0,0,3,2,2,None,Cardio,Cinnamon water,,,
01-09-2025 08:06,18-29,<50,150-159,Daily,29-35 days,Irregular,Heavy,1-3 months,Premenopause,2,1,3,0,1,1,5-6 hrs,Moderate,Moderate,4-5 hrs,Gluten,Calcium rich,2L,Frequent,2,3,2,3,3,High sugar,Strength,Aloe vera juice,,,
01-09-2025 08:09,55-59,50-59,160-169,1-2 times/week,35+ days,Irregular,Medium,3-6 months,Perimenopause,3,2,4,2,2,3,7-8 hrs,High,None,6-8 hrs,Soy,Low GI,1-2L,Rare,1,1,1,2,0,Fried foods,Yoga,Fenugreek seeds,,,
01-09-2025 08:12,40-44,60-69,170-179,Daily,24-28 days,Regular,Heavy,0 months,Premenopause,0,0,1,0,0,0,8+ hrs,Low,Low,2-4 hrs,None,High protein,3L,Rare,0,0,0,0,0,None,Strength,Turmeric milk,,,
01-09-2025 08:15,30-39,70-79,150-159,3-4 times/week,29-35 days,Regular,Medium,0 months,Premenopause,1,1,1,1,2,2,6-7 hrs,Moderate,Moderate,5-7 hrs,Dairy,Calcium rich,2-3L,Occasional,2,2,2,1,1,High sugar,Cardio,Aloe vera juice,,,
01-09-2025 08:18,50-54,50-59,160-169,Rarely / None,Not applicable,No periods,Light,6+ months,Postmenopause,3,2,2,3,2,2,7-8 hrs,High,High,8+ hrs,None,Iron rich,2L,Frequent,1,1,2,2,2,Fried foods,Yoga,Cinnamon water,,,
01-09-2025 08:21,18-29,60-69,170-179,Daily,<24 days,Irregular,Heavy,1-3 months,Premenopause,2,2,3,1,3,2,5-6 hrs,Moderate,Moderate,4-5 hrs,Gluten,Low GI,3L,Rare,0,2,1,3,3,High sugar,Strength,Fenugreek seeds,,,
01-09-2025 08:24,45-49,70-79,160-169,1-2 times/week,24-28 days,Regular,Medium,0 months,Perimenopause,1,1,2,2,1,2,7-8 hrs,Low,Low,6-8 hrs,Dairy,Calcium rich,2-3L,Occasional,2,1,1,2,2,None,Yoga,Aloe vera juice,,,
01-09-2025 08:27,30-39,<50,150-159,3-4 times/week,29-35 days,Irregular,Medium,3-6 months,Premenopause,3,2,3,2,3,3,6-7 hrs,High,Low,4-5 hrs,Soy,High protein,1-2L,Frequent,1,3,2,3,2,Fried foods,Cardio,Cinnamon water,,,
01-09-2025 08:30,50-54,70-79,160-169,Rarely / None,Not applicable,No periods,Light,6+ months,Postmenopause,4,3,4,3,2,4,7-8 hrs,High,High,8+ hrs,None,Iron rich,3L,Frequent,2,2,3,3,3,Fried foods,Strength,Turmeric milk,,,
01-09-2025 08:33,40-44,60-69,170-179,Daily,24-28 days,Regular,Medium,0 months,Premenopause,0,0,1,1,0,1,8+ hrs,Low,Low,2-4 hrs,Dairy,High protein,2-3L,Rare,0,0,0,0,0,None,Yoga,Cinnamon water,,,
01-09-2025 08:36,18-29,<50,150-159,3-4 times/week,29-35 days,Irregular,Heavy,1-3 months,Premenopause,2,1,3,2,1,2,5-6 hrs,Moderate,Moderate,4-5 hrs,Gluten,Calcium rich,1-2L,Occasional,2,3,1,2,3,High sugar,Cardio,Aloe vera juice,,,
01-09-2025 08:39,30-39,50-59,160-169,Daily,<24 days,Regular,Medium,0 months,Premenopause,1,1,2,0,1,1,7-8 hrs,Low,Low,5-7 hrs,None,Iron rich,2-3L,Rare,1,0,1,1,1,None,Strength,Aloe vera juice,,,
01-09-2025 08:42,55-59,70-79,170-179,Rarely / None,Not applicable,No periods,Light,6+ months,Postmenopause,3,2,3,4,2,3,6-7 hrs,High,High,8+ hrs,Soy,Calcium rich,3L,Frequent,2,2,3,3,3,Fried foods,Yoga,Fenugreek seeds,,,
01-09-2025 08:45,45-49,60-69,150-159,1-2 times/week,29-35 days,Irregular,Heavy,3-6 months,Perimenopause,2,2,3,3,3,2,6-7 hrs,Moderate,Moderate,6-8 hrs,Dairy,Low GI,2L,Occasional,1,2,2,2,2,High sugar,Cardio,Cinnamon water,,,
01-09-2025 08:48,50-54,50-59,160-169,Rarely / None,Not applicable,No periods,Light,6+ months,Postmenopause,4,3,4,4,4,4,7-8 hrs,High,None,8+ hrs,None,Iron rich,2-3L,Frequent,0,1,3,3,3,Fried foods,Yoga,Turmeric milk,,,
01-09-2025 08:51,18-29,60-69,170-179,Daily,24-28 days,Regular,Heavy,0 months,Premenopause,1,0,2,1,1,2,5-6 hrs,Low,Moderate,4-5 hrs,Gluten,High protein,1-2L,Rare,2,3,1,3,3,High sugar,Strength,Fenugreek seeds,,,
01-09-2025 08:54,30-39,<50,150-159,3-4 times/week,29-35 days,Irregular,Medium,3-6 months,Perimenopause,2,2,3,2,3,3,6-7 hrs,Moderate,High,5-7 hrs,Soy,Calcium rich,3L,Frequent,1,2,2,3,2,Fried foods,Cardio,Aloe vera juice,,,
01-09-2025 08:57,40-44,70-79,160-169,Daily,24-28 days,Regular,Medium,0 months,Premenopause,0,0,1,1,0,0,8+ hrs,Low,Low,2-4 hrs,None,High protein,2-3L,Rare,0,0,0,0,0,None,Strength,Cinnamon water,,,
09-26-2025 12:01:00,50-54,60-69,160-169,Rarely / None,Not applicable,No periods,Heavy,6+ months,Postmenopause,5,5,4,4,5,4,5-6 hours,High,High (4+ cups/day),8+ hours,"Dairy, Gluten","Low GI, Iron rich",<1L,Frequent (>3/month),0,0,4,4,4,Fried foods,None,Cinnamon water,,,
09-26-2025 12:02:00,18-29,80+,170-179,Daily,24-28 days,Regular,Heavy,0 months,Premenopause,0,0,4,4,4,5,5-6 hours,High,Moderate (2-3 cups/day),8+ hours,None,"High protein, Omega 3 rich",3+L,Rare (<1/month),4,5,5,5,5,High sugar,Strength,Fenugreek seeds,,,
09-26-2025 12:03:00,30-39,70-79,150-159,1-2 times/week,35+ days,Irregular,Medium,3-6 months,Perimenopause,3,2,4,3,4,3,6-7 hrs,High,Low (1 cup/day),5-7 hours,"Soy, Gluten",Calcium rich,1-2L,Occasional (1-3/month),2,3,4,4,4,None,Yoga,Turmeric milk,,,
09-26-2025 12:04:00,45-49,50-59,<150,Daily,24-28 days,Regular,Light,0 months,Premenopause,0,0,1,1,1,0,7-8 hours,Low,None,2-4 hours,None,"Iron rich, Omega 3 rich",3+L,Rare (<1/month),0,0,0,0,0,None,Cardio,Aloe vera juice,,,
09-26-2025 12:05:00,55-59,50-59,160-169,Rarely / None,Not applicable,No periods,Medium,12+ months,Postmenopause,4,3,3,2,3,3,9+ hours,Moderate,None,5-7 hours,Seafood,"Low GI, High protein",2-3L,Frequent (>3/month),0,0,2,2,2,Fried foods,None,Fenugreek seeds,,,
09-26-2025 12:06:00,18-29,<50,150-159,3-4 times/week,<24 days,Regular,Heavy,0 months,Premenopause,1,0,2,1,0,1,5-6 hours,Moderate,Moderate (2-3 cups/day),4-5 hrs,Dairy,"High protein, Calcium rich",1-2L,Rare (<1/month),1,1,0,1,1,High sugar,Strength,Turmeric milk,,,
09-26-2025 12:07:00,40-44,60-69,150-159,Daily,29-35 days,Irregular,Medium,1-3 months,Perimenopause,2,2,3,3,3,4,6-7 hrs,High,Low (1 cup/day),<2 hours,"Soy, Seafood","Low GI, Iron rich",1-2L,Occasional (1-3/month),0,0,3,3,3,Dairy,Yoga,Cinnamon water,,,
09-26-2025 12:08:00,30-39,70-79,160-169,Rarely / None,24-28 days,Regular,Heavy,0 months,Unknown,1,1,5,5,0,0,<5 hours,High,Moderate (2-3 cups/day),8+ hours,"Gluten, Dairy",High protein,1-2L,Rare (<1/month),3,4,5,5,0,Fried foods,None,Fenugreek seeds,,,
09-26-2025 12:09:00,50-54,<50,170-179,3-4 times/week,Not applicable,No periods,Light,12+ months,Postmenopause,3,2,2,2,3,2,7-8 hours,Low,None,2-4 hours,None,"Low GI, Omega 3 rich",3+L,Rare (<1/month),0,0,0,0,0,None,Cardio,Aloe vera juice,,,
09-26-2025 12:10:00,45-49,60-69,150-159,Daily,24-28 days,Regular,Medium,0 months,Premenopause,0,0,1,1,1,1,7-8 hours,Moderate,Low (1 cup/day),5-7 hours,"Soy",Calcium rich,2-3L,Rare (<1/month),0,0,1,1,1,High sugar,Yoga,Turmeric milk,,,
09-26-2025 12:11:00,18-29,50-59,150-159,1-2 times/week,35+ days,Irregular,Medium,1-3 months,Premenopause,0,0,3,2,3,3,6-7 hrs,Moderate,None,4-5 hrs,None,"High protein, Iron rich",2-3L,Occasional (1-3/month),3,2,3,2,3,High sugar,Strength training,Cinnamon water,,,
09-26-2025 12:12:00,40-44,80+,160-169,Rarely / None,24-28 days,Regular,Heavy,0 months,Perimenopause,2,2,4,4,0,3,5-6 hours,High,High (4+ cups/day),<2 hours,"Dairy",High protein,1-2L,Rare (<1/month),0,0,4,4,0,Fried foods,None,Fenugreek seeds,,,
09-26-2025 12:13:00,50-54,70-79,170-179,3-4 times/week,Not applicable,No periods,Light,6+ months,Postmenopause,5,4,4,3,4,4,7-8 hrs,Moderate,None,2-4 hours,"Soy",Iron rich,3+L,Frequent (>3/month),0,0,2,2,2,None,Cardio,Turmeric milk,,,
09-26-2025 12:14:00,30-39,<50,<150,Daily,<24 days,Regular,Medium,0 months,Premenopause,0,0,1,0,0,0,8+ hours,Low,Low (1 cup/day),2-4 hours,None,"High protein, Calcium rich",3+L,Rare (<1/month),0,0,0,0,0,None,Yoga,Aloe vera juice,,,
09-26-2025 12:15:00,45-49,60-69,150-159,3-4 times/week,29-35 days,Irregular,Heavy,4-6 months,Perimenopause,2,1,4,3,4,4,5-6 hours,Moderate,Moderate (2-3 cups/day),5-7 hours,"Gluten, Seafood",High protein,1-2L,Occasional (1-3/month),1,2,5,3,4,High sugar,Strength,Cinnamon water,,,
09-26-2025 12:16:00,55-59,70-79,160-169,Rarely / None,Not applicable,No periods,Medium,0 months,Postmenopause,1,1,2,2,3,3,7-8 hours,Moderate,Low (1 cup/day),8+ hours,None,"Iron rich, Omega 3 rich",2-3L,Rare (<1/month),0,0,1,1,1,Fried foods,None,Fenugreek seeds,,,
09-26-2025 12:17:00,18-29,50-59,150-159,1-2 times/week,24-28 days,Regular,Light,0 months,Premenopause,0,0,1,0,1,0,6-7 hrs,Low,None,<2 hours,Dairy,"High protein, Calcium rich",1-2L,Rare (<1/month),0,0,0,0,0,None,Cardio,Turmeric milk,,,
09-26-2025 12:18:00,40-44,<50,170-179,Daily,24-28 days,Regular,Medium,0 months,Premenopause,0,0,0,0,0,0,8+ hours,Low,None,2-4 hours,Gluten,"High protein, Low GI",3+L,Rare (<1/month),0,0,0,0,0,None,Yoga,Aloe vera juice,,,
09-26-2025 12:19:00,50-54,60-69,150-159,3-4 times/week,35 days,Irregular,Heavy,1-3 months,Perimenopause,3,2,5,4,4,4,5-6 hours,High,Moderate (2-3 cups/day),5-7 hours,"Soy, Seafood","Iron rich, Omega 3 rich",1-2L,Frequent (>3/month),1,2,3,4,5,High sugar,Strength training,Cinnamon water,,,
09-26-2025 12:20:00,30-39,70-79,160-169,Rarely / None,Not applicable,No periods,Medium,12+ months,Postmenopause,4,3,3,3,4,4,7-8 hours,High,High (4+ cups/day),8+ hours,"Dairy, Gluten, Soy",None,<1L,Frequent (>3/month),0,0,5,5,5,Fried foods,None,Fenugreek seeds,,,
"""

def load_data(file_path, fallback_string):
    """
    Tries to load data from the specified file path. 
    If the file is not found, it uses the provided fallback string.
    Aggressively cleans column names immediately after loading.
    """
    try:
        # Resolve the relative path
        script_dir = os.path.dirname(os.path.abspath(__file__)) 
        full_path = os.path.join(script_dir, file_path) # Correctly join the path parts

        if os.path.exists(full_path):
            print(f"Loading data from file: {full_path}")
            df = pd.read_csv(full_path)
        else:
            print(f"File not found at {full_path}. Using embedded data string.")
            df = pd.read_csv(StringIO(fallback_string))

        # --- CRITICAL FIX: AGGRESSIVE COLUMN NAME CLEANING TO SNAKE_CASE ---
        original_cols = df.columns
        new_cols = {}
        for col in original_cols:
            cleaned_col = col.strip()
            cleaned_col = re.sub(r'[^\w\s-]', '', cleaned_col) 
            standardized_col = re.sub(r'[\s-]+', '_', cleaned_col).lower()
            standardized_col = re.sub('_+', '_', standardized_col)
            new_cols[col] = standardized_col.strip('_')

        df.columns = list(new_cols.values())
        
        # --- ROBUST KEY ERROR FIX for self_reported_stage ---
        if 'self_reported_stage' not in df.columns:
            stage_match = [col for col in df.columns if 'stage' in col]
            if stage_match:
                df.rename(columns={stage_match[0]: 'self_reported_stage'}, inplace=True)
            else:
                if len(df.columns) > 9:
                    current_name = df.columns[9]
                    df.rename(columns={current_name: 'self_reported_stage'}, inplace=True)
                # print(f"✅ Ensured 'self_reported_stage' is present.")

        df = df.replace('', '-', regex=True)
        return df
    except Exception as e:
        print(f"Error loading or initially cleaning data: {e}")
        return None

def clean_range_column(series, mapping_dict):
    """Converts range strings (e.g., '45-49') to numerical midpoints."""
    series = series.astype(str).str.strip().str.lower().str.replace(' ', '_').str.replace('-', '_').str.replace('__', '_')
    
    def get_midpoint(value):
        value = str(value).strip('_')
        if value in mapping_dict:
            return mapping_dict[value]
        
        # Handle ranges like '24_28_days' or '5_6_hours'
        match = re.match(r'(\d+)_(\d+)', value)
        if match:
            lower = float(match.group(1))
            upper = float(match.group(2))
            return (lower + upper) / 2
        
        return np.nan # Mark unhandled values

    return series.apply(get_midpoint)

def to_ternary(value):
    """Maps a 0-5 severity scale to a 3-class (ternary) scale: 0=Mild, 1=Moderate, 2=Severe."""
    if value <= 1: return 0
    if value <= 3: return 1
    return 2

def preprocess_onboarding_data(df):
    """
    Cleans, transforms, and encodes the onboarding data with aggressive feature engineering.
    """
    if df is None or df.empty:
        return pd.DataFrame()

    # --- 1. Drop Uninformative and Original Range Columns ---
    df = df.drop(columns=['column_32', 'column_33', 'column_34'], errors='ignore')
    df = df.drop(columns=['timestamp'], errors='ignore') # Drop Timestamp as it's not predictive

    # --- 2. Clean and Standardize Range/Ordinal Columns (Numerical Midpoints) ---
    
    # Age Group, Weight, Height (Numerical Midpoints - KEPT TEMPORARILY FOR BINNING/BMI)
    age_map = {'18_29': 23.5, '30_39': 34.5, '40_44': 42, '45_49': 47, '50_54': 52, '55_59': 57, '60': 62, '60_': 62}
    df['age_midpoint_raw'] = clean_range_column(df['age_group'], age_map).fillna(47) # Fill NaN age with midpoint

    weight_map = {'50': 45, '80': 85, '50_59': 54.5, '60_69': 64.5, '70_79': 74.5, '80': 85, '_50': 45, '80_': 85} 
    df['weight_midpoint'] = clean_range_column(df['weight_range_kg'], weight_map).fillna(64.5)

    height_map = {'150': 145, '150_159': 154.5, '160_169': 164.5, '170_179': 174.5, '_150': 145} 
    df['height_midpoint'] = clean_range_column(df['height_range_cm'], height_map).fillna(164.5)
    
    # Calculate BMI
    df['bmi'] = df['weight_midpoint'] / (df['height_midpoint'] / 100)**2
    
    # Drop original weight/height/age range columns
    df.drop(columns=['age_group', 'weight_range_kg', 'height_range_cm'], inplace=True)
    
    # Ordinal Encoding: Exercise Frequency
    exercise_map = {'rarely / none': 0, '1-2 times/week': 1.5, '3-4 times/week': 3.5, 'daily': 7}
    df['exercise_frequency_wk'] = df['exercise_frequency'].str.lower().map(exercise_map).fillna(0)
    df.drop(columns=['exercise_frequency'], inplace=True)

    # Ordinal Encoding: Flow Intensity, Cycle Length (Days), Skipped Periods (Months)
    flow_map = {'light': 1, 'medium': 2, 'heavy': 3}
    df['flow_intensity_encoded'] = df['flow_intensity_usual'].str.lower().map(flow_map).fillna(2) 
    df.drop(columns=['flow_intensity_usual'], inplace=True)

    cycle_map = {'not_applicable_no_periods': 999, 'not_applicable': 999, 'no_periods': 999, '_24_days': 20, '35_days': 35, '35_days': 35} # Added 35_days for consistency
    df['cycle_length_days'] = clean_range_column(df['average_cycle_length'], cycle_map).fillna(999)
    df.drop(columns=['average_cycle_length'], inplace=True)

    skipped_map = {'0_months': 0, '1_3_months': 2, '4_6_months': 5, '6_months': 9, '12_months': 12, '6_months': 9, '12_months': 12}
    df['skipped_periods_months'] = df['skipped_periods_past_12_months'].astype(str).str.lower().map(skipped_map).fillna(0)
    df.drop(columns=['skipped_periods_past_12_months'], inplace=True)

    # Ordinal Encoding: Sleep, Stress, Caffeine, Screen, Water, Irregular Periods (re-using existing logic)
    sleep_map = {'_5_hours': 4, '5_6_hours': 5.5, '6_7_hrs': 6.5, '7_8_hours': 7.5, '8_hrs': 8.5, '9_hours': 10, '9_hrs': 10, '8_hours': 9} # Fixed '8_hours' inconsistency
    df['avg_sleep_hours_raw'] = df['average_sleep_per_night'].astype(str).str.lower().map(sleep_map).fillna(7.5)
    df.drop(columns=['average_sleep_per_night'], inplace=True)

    stress_map = {'low': 1, 'moderate': 2, 'high': 3}
    df['stress_level_encoded'] = df['stress_level_past_3_months'].str.lower().map(stress_map).fillna(2)
    df.drop(columns=['stress_level_past_3_months'], inplace=True)

    caffeine_map = {'none': 0, 'low_1_cupday': 1, 'low': 1, 'moderate_2_3_cupsday': 2.5, 'moderate': 2.5, 'high_4_cupsday': 4, 'high': 4}
    df['caffeine_cups_day_raw'] = df['caffeine_intake'].str.lower().map(caffeine_map).fillna(0)
    df.drop(columns=['caffeine_intake'], inplace=True)

    screen_map = {'_2_hours': 1, '2_4_hours': 3, '4_5_hrs': 4.5, '5_7_hours': 6, '6_8_hrs': 7, '8_hours': 9, '8_hrs': 9}
    df['screen_time_hours_raw'] = df['screen_time_per_day'].str.lower().map(screen_map).fillna(6)
    df.drop(columns=['screen_time_per_day'], inplace=True)

    water_map = {'_1l': 0.5, '1_2l': 1.5, '2_3l': 2.5, '3l': 3.5, '3_l': 3.5}
    df['water_intake_liters'] = df['water_intake_per_day'].str.lower().map(water_map).fillna(1.5)
    df.drop(columns=['water_intake_per_day'], inplace=True)

    irregular_freq_map = {'rare_1month': 0.5, 'occasional_1_3month': 2, 'frequent_3month': 4, 'rare': 0.5, 'occasional': 2}
    df['irregular_periods_freq'] = df['irregular_periods_frequency'].str.lower().map(irregular_freq_map).fillna(0.5)
    df.drop(columns=['irregular_periods_frequency'], inplace=True)

    # --- 3. Rename and Standardize Original Severity Columns (0-5) ---
    # NOTE: The names here MUST match the original names used in the Fallback data cleanup output
    severity_cols_map = {
        'hot_flashes_severity': 'Hot_Flashes_Severity_0_5',
        'night_sweats_severity': 'Night_Sweats_Severity_0_5',
        'mood_swings_severity': 'Mood_Swings_Severity_0_5',
        'sleep_disturbances_severity': 'Sleep_Disturbances_Severity_0_5',
        'fatigue_severity': 'Fatigue_Severity_Meno_0_5',
        'brain_fog_memory_issues_severity': 'Brain_Fog_Severity_0_5',
        'hair_growth_on_face_body': 'Hair_Growth_Severity_0_5',
        'acne_severity': 'Acne_Severity_0_5',
        'weight_gain_belly_fat': 'Weight_Gain_BellyFat_Severity_0_5',
        'mood_swings_irritability': 'Mood_Swings_Irritability_Severity_0_5',
        'fatigue': 'Fatigue_Severity_PCOS_0_5',
    }
    df.rename(columns=severity_cols_map, inplace=True, errors='ignore')
    
    # Ensure all original severity columns are numeric (0-5)
    original_severity_cols = list(severity_cols_map.values())
    for col in original_severity_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).clip(0, 5)


    # --- 4. TARGET VARIABLE TRANSFORMATION & REMOVAL ---
    ternary_severity_cols = {col: col.replace('0_5', 'Ternary') for col in original_severity_cols if col in df.columns}
    
    for original_col, ternary_col in ternary_severity_cols.items():
        df[ternary_col] = df[original_col].apply(to_ternary)
        # Drop the original 0-5 scale column
        df.drop(columns=[original_col], inplace=True)


    # --- 5. FEATURE BINNING AND ONE-HOT ENCODING (New Engineered Features) ---

    # 5.1 BMI Category
    bins_bmi = [0, 18.5, 25, 30, 100]
    labels_bmi = ['Underweight', 'Normal', 'Overweight', 'Obese']
    df['bmi_category'] = pd.cut(df['bmi'], bins=bins_bmi, labels=labels_bmi, right=False).astype(str)
    
    # 5.2 Age Group (simplified)
    bins_age = [0, 40, 50, 60, 100]
    labels_age = ['Younger_than_40', '40_49', '50_59', '60_plus']
    df['age_group_simplified'] = pd.cut(df['age_midpoint_raw'], bins=bins_age, labels=labels_age, right=False).astype(str)

    # 5.3 Sleep Group
    bins_sleep = [0, 6, 8.5, 24]
    labels_sleep = ['Short_Sleep', 'Normal_Sleep', 'Long_Sleep']
    df['sleep_group'] = pd.cut(df['avg_sleep_hours_raw'], bins=bins_sleep, labels=labels_sleep, right=False).astype(str)

    # 5.4 Caffeine Group
    bins_caffeine = [0, 1.1, 3.5, 10] # None(0), Low(1), Mod/High(>1)
    labels_caffeine = ['Caffeine_None', 'Caffeine_Low', 'Caffeine_Moderate_High']
    df['caffeine_group'] = pd.cut(df['caffeine_cups_day_raw'], bins=bins_caffeine, labels=labels_caffeine, right=False).fillna('Caffeine_None').astype(str)
    
    # 5.5 Screen Time Group
    bins_screen = [0, 4.1, 7.1, 24]
    labels_screen = ['Screen_Low', 'Screen_Moderate', 'Screen_High']
    df['screen_group'] = pd.cut(df['screen_time_hours_raw'], bins=bins_screen, labels=labels_screen, right=False).astype(str)
    
    
    # 5.6 One-Hot Encode NEW Categorical Features
    new_categorical_cols = ['bmi_category', 'age_group_simplified', 'sleep_group', 'caffeine_group', 'screen_group']
    df = pd.get_dummies(df, columns=new_categorical_cols, prefix=new_categorical_cols)

    # 5.7 Clean up raw/redundant columns
    df.drop(columns=['bmi', 'age_midpoint_raw', 'avg_sleep_hours_raw', 'caffeine_cups_day_raw', 
                     'screen_time_hours_raw', 'weight_midpoint', 'height_midpoint'], inplace=True, errors='ignore')


    # --- 6. Encoding Original Categorical Columns (re-using existing logic) ---

    # One-Hot Encoding: Avoided Foods (Multi-Select)
    foods_col = 'do_you_avoid_any_of_these_foods_select_all_that_apply'
    foods_avoided = df[foods_col].astype(str).str.lower().str.replace('none', 'None Avoided', regex=False).str.replace(' ', '_')
    df_avoided = foods_avoided.str.get_dummies(sep=',_').add_prefix('Avoided_')
    df = pd.concat([df, df_avoided], axis=1).drop(columns=[foods_col], errors='ignore')

    # One-Hot Encoding: Dietary Preferences (Multi-Select)
    diet_col = 'dietary_preferences_goals_select_all_that_apply'
    diet_prefs = df[diet_col].astype(str).str.replace(' ', '_').str.lower()
    df_diet = diet_prefs.str.get_dummies(sep=',_').add_prefix('Diet_Goal_')
    df = pd.concat([df, df_diet], axis=1).drop(columns=[diet_col], errors='ignore')

    # One-Hot Encoding: Worsening Foods
    df['foods_worsen_symptoms_col'] = df['foods_that_worsen_symptoms'].fillna('None_Identified')
    df_worsen = pd.get_dummies(df['foods_worsen_symptoms_col'], prefix='Worsen_Food')
    df = pd.concat([df, df_worsen], axis=1).drop(columns=['foods_that_worsen_symptoms', 'foods_worsen_symptoms_col'], errors='ignore')

    # One-Hot Encoding: Exercise Type
    df['exercise_type_col'] = df['exercise_type'].fillna('None_Reported')
    df_exercise = pd.get_dummies(df['exercise_type_col'], prefix='Ex_Type')
    df = pd.concat([df, df_exercise], axis=1).drop(columns=['exercise_type', 'exercise_type_col'], errors='ignore')

    # One-Hot Encoding: Remedies
    df['remedy_col'] = df['add_remedies_often_used_for_pcos'].fillna('None_Reported')
    df_remedy = pd.get_dummies(df['remedy_col'], prefix='Remedy')
    df = pd.concat([df, df_remedy], axis=1).drop(columns=['add_remedies_often_used_for_pcos', 'remedy_col'], errors='ignore')

    # Ordinal/Nominal Encoding: Cycle Regularity and Stage
    regularity_map = {'regular': 1, 'irregular': 2, 'no periods': 999}
    df['cycle_regularity_encoded'] = df['cycle_regularity_past_12_months'].str.lower().map(regularity_map).fillna(999)
    df.drop(columns=['cycle_regularity_past_12_months'], inplace=True, errors='ignore')

    stage_map = {
        'premenopause_regular_cycles_no_symptoms': 0, 'premenopause': 0,
        'perimenopause_irregular_cycles_symptoms_starting': 1, 'perimenopause': 1,
        'menopause_no_period_for_12_months': 2, 
        'postmenopause_more_than_12_months_without_periods': 3, 'postmenopause': 3,
        'unknown': -1,
    }
    df['self_reported_stage_encoded'] = df['self_reported_stage'].astype(str).str.lower().map(stage_map).fillna(-1)
    df.drop(columns=['self_reported_stage'], inplace=True, errors='ignore')

    # --- 7. Final Cleanup and Output ---
    
    # Final cleanup of any newly created column names
    df.columns = df.columns.str.lower().str.replace('[^a-z0-9_]+', '', regex=True)
    df.columns = df.columns.str.replace('__', '_', regex=False)
    
    df = df.fillna(0)
    
    # Reorder columns to put Ternary Targets first
    final_targets = [col.lower() for col in ternary_severity_cols.values() if col.lower() in df.columns]
    final_features = [col for col in df.columns if col not in final_targets]
    df = df[final_targets + final_features]
    
    return df

def main():
    """Main function to handle file loading and saving."""
    
    # Change current working directory to the script's location for relative paths to work
    script_dir = os.path.dirname(os.path.abspath(__file__)) 
    os.chdir(script_dir)
    
    # 1. Load Data
    df_raw = load_data(RAW_DATA_PATH, FALLBACK_DATA_STRING)
    
    if df_raw is None:
        return

    # 2. Preprocess Data
    print("Starting data preprocessing (Aggressive Feature Engineering Applied)...")
    df_cleaned = preprocess_onboarding_data(df_raw)

    # 3. Save Data to the specified output directory
    os.makedirs(PROCESSED_OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(PROCESSED_OUTPUT_DIR, OUTPUT_FILENAME)
    df_cleaned.to_csv(output_path, index=False)
    
    # 4. Print Summary
    print("\n--- Preprocessing Complete ---")
    print("Ternary targets (0=Mild, 1=Moderate, 2=Severe) created for all symptoms.")
    print(f"Data saved to: {output_path}")
    print(f"Original shape: ({df_raw.shape[0]}, {df_raw.shape[1]})")
    print(f"Cleaned shape: ({df_cleaned.shape[0]}, {df_cleaned.shape[1]})")
    print("----------------------------")
    


if __name__ == '__main__':
    main()