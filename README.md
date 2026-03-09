# MenoMap: Personalized Menopause Management System

MenoMap is a comprehensive full-stack application designed to support women through their menopause journey using personalized AI-driven insights, symptom tracking, and wellness planning.

## 🌟 Key Features
- **AI Stage Prediction**: Accurately identifies menopause stages (Pre, Peri, Meno, Post) using custom-trained Random Forest models.
- **Adaptive Diet Planner**: Generates personalized meal plans based on regional preferences (South/North Indian), dietary restrictions (Veg/Non-Veg), and symptom triggers.
- **Dynamic Relief Recommender**: Scores and suggests natural remedies and exercises (Yoga, Diet, Supplements) tailored to individual symptom efficacy.
- **Symptom Tracker**: Comprehensive logging for 11+ menopausal symptoms with intensity analysis.
- **Smart Reports**: Automatically summarizes logs for doctor consultations with PDF export functionality.

## 🏗️ System Architecture
The system follows a decoupled frontend-backend architecture:
- **Frontend**: Built with React Native & Expo for a seamless mobile experience.
- **Backend**: FastAPI-based microservices handling ML inference, data persistence, and logic.
- **Predictive Engine**: Scikit-learn models trained on curated onboarding data to provide personalized health metrics.
- **Database**: SQLite for local data security and rapid access.

## 🧠 Machine Learning Models
MenoMap utilizes a multi-model pipeline:
1. **Stage Predictor**: Random Forest Classifier (Accuracy: ~75%).
2. **Symptom Severity Predictor**: Multi-output predictor for 11 core symptoms.
3. **Relief Efficacy Recommender**: Ensemble of models tracking the effectiveness of 6+ unique relief methods.
4. **Diet Suitability Engine**: Ranks recipe suitability based on symptom constraints.

## 📊 Evaluation Results
- **Stage Model F1-Score**: 0.74 (Validated via 5-fold Cross-Validation).
- **Inference Latency**: <10ms per prediction.
- **Model Stability**: 0.00% drift observed in recent testing cycles.

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Expo CLI

### Frontend Setup
```bash
cd frontend
npm install
npx expo start
```

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```

## 📁 Repository Structure
```text
.
├── frontend/           # React Native App (Expo)
├── backend/            # FastAPI Server & Core Services
├── ml_models/          # Production-ready .pkl model files
├── ml_research/        # Audit scripts, training, and research notebooks
├── datasets_sample/    # Sample data for testing and demonstration
├── docs/               # System audit reports, QA logs, and technical docs
├── figures/            # ML visualizations and confusion matrices
└── LICENSE             # MIT License
```

## ⚖️ Copyright & License
Distributed under the MIT License. See `LICENSE` for more information.
Copyright (c) 2026 MenoMap Project.
