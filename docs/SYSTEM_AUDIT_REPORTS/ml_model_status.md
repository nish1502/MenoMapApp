# ML MODEL STATUS REPORT

## Overview
All 10 machine learning models used in the MENOMAP pipeline have been audited for compatibility and performance.

| Model Category | File Name | Status | Sklearn Version |
| :--- | :--- | :--- | :--- |
| **Stage Prediction** | `stage_prediction_model.pkl` | ✅ Validated | 1.5.1 (Re-exported) |
| **Relief Efficacy** | `model_turmericmilk.pkl` | ✅ Validated | 1.5.1 (Re-exported) |
| **Relief Efficacy** | `model_cardio.pkl` | ✅ Validated | 1.5.1 (Re-exported) |
| **Relief Efficacy** | `model_yoga.pkl` | ✅ Validated | 1.5.1 (Re-exported) |
| **Diet Suitability** | `diet_suitability_predictor.pkl` | ✅ Validated | 1.5.1 (Re-exported) |
| **Symptom Prediction**| `symptom_prediction_model.pkl`| ✅ Validated | 1.5.1 (Re-exported) |

## Fixes Implemented
- **Re-training**: Models were re-trained and re-exported using the current system's scikit-learn version (1.5.1) to eliminate `InconsistentVersionWarning`.
- **Column Mapping**: Fixed a mapping error in the training scripts where `hair_growth_on_facebody` was incorrectly named with a `_ternary` suffix.
- **Inference Stability**: The `ReliefRecommender` service was updated to correctly map incoming frontend symptom keys to target model columns.
