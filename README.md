
# 🩺 MenoMap - Menopause Management App

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![Expo](https://img.shields.io/badge/Expo-React%20Native-blue)](https://expo.dev/) [![React Navigation](https://img.shields.io/badge/React%20Navigation-6.x-brightgreen)](https://reactnavigation.org/)  

**MenoMap** is an AI-assisted mobile application that helps women **track, manage, and understand their menopause journey**. Log symptoms, follow diet plans, track relief, and get doctor-ready reports – all in one app.

## 🚀 Features

### Core Features (MVP)
- **Home Dashboard** – Quick access to symptoms, cycles, brain fog logs  
- **Symptom Tracker** – Log daily symptoms and view history  
- **PCOS Mode** – Track PCOS-specific symptoms with recommendations  
- **Relief Tracker** – Monitor relief from treatments (Yoga, herbal teas, etc.)  
- **Diet Planner** – Region-specific diet recommendations  
- **Symptom Coach** – AI-powered suggestions based on logged symptoms  
- **Settings** – Manage profile, notifications, and app info  

### Stretch Features
- Cycle timeline and trend charts  
- Doctor-ready report generation (PDF / CSV)  
- Cloud sync & Firebase backend  
- Advanced AI symptom prediction and insights  

## 🛠 Tech Stack

- **Frontend:** React Native, Expo  
- **Navigation:** React Navigation (Bottom Tabs & Stack)  
- **UI Components:** React Native Paper  
- **Charts:** react-native-chart-kit  
- **State Management:** React Hooks & AsyncStorage  
- **Backend (Optional):** Firebase  
- **AI/ML:** Symptom pattern analysis  

## 💻 Setup & Installation

# Clone repository
git clone https://github.com/yourusername/MenoMapApp.git
cd MenoMapApp

# Install dependencies
npm install

# Start development server
npx expo start

Open the app using:

* iOS Simulator (Mac only)
* Android Emulator
* Expo Go app on mobile

## 📂 Folder Structure (Key Files)

/app
  /components        # Reusable UI components (SymptomCard, ChartCard)
  /navigation        # RootNavigator.js, AppNavigator.js
  /screens           # Screens grouped by feature
    /Home
    /PCOS
    /Coach
    /Diet
    /Reports
    /Auth
  App.js             # Entry point


## 👩‍💻 Team Roles

| Team Member | Role                  | Responsibilities                          |
| ----------- | --------------------- | ----------------------------------------- |
| Nishita     | Frontend Lead         | UI, screens, navigation, charts           |
| Aditi       | AI/ML Lead            | Symptom analysis, AI recommendations      |
| Documenter  | Documentation         | README, reports, deployment instructions  |


## 📆 Development Timeline (3 Weeks)

| Week | Goals                                                                 |
| ---- | --------------------------------------------------------------------- |
| 1    | Core screens, navigation, symptom tracker MVP                         |
| 2    | PCOS Mode, Relief Tracker, Settings, basic charts, ML integration     |
| 3    | UI polish, bug fixes, optional features (doctor reports, advanced AI) |


## 🔮 Future Enhancements

* Predictive symptom patterns using AI
* Multi-device cloud sync
* Interactive health reminders & notifications
* Export reports (PDF / Excel)
* Advanced dietary recommendations

## 📄 License

This project is **MIT licensed**. See `LICENSE` for details.

