# ML Model Evaluation Report - MENOMAP

## 1. Introduction
Evaluation of the MENOMAP predictive pipeline.

## 2. Dataset Summary
- **Primary Source**: `cleaned_onboarding_data.csv`
- **Total Samples**: 146

## 3. Evaluation Metrics

| Model                  |   Accuracy |   F1 Score |
|:-----------------------|-----------:|-----------:|
| Stage Predictor        |     0.7059 |     0.7094 |
| Relief: Yoga           |     0.9091 |     0.9063 |
| Relief: Turmericmilk   |     0.9167 |     0.9169 |
| Relief: Aloeverajuice  |     0.96   |     0.959  |
| Relief: Cinnamonwater  |     0.9062 |     0.9045 |
| Relief: Cardio         |     0.8333 |     0.8338 |
| Relief: Fenugreekseeds |     0.9024 |     0.9018 |

## 4. Visualizations

### Stage Predictor: Confusion Matrix
![CM](ML_REPORT_FIGURES/cm_stage_predictor.png)

## 5. API Performance
- **Average Latency**: 0.0040 seconds
- **Success Rate**: 100%

## 6. System Consistency Check
- Scikit-Learn version mismatch flagged (Inference: 1.5.1, Training: 1.7.x).
- Metadata consistency: feature labels aligned after robust matching.

## 7. Recommendations
1. Re-train models to align sklearn versions.
2. Expand dataset to improve recall for 'Postmenopause' stage.