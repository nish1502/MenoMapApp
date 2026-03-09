# MENOMAP_QA_TEST_REPORT.md

## 🔍 Audit Overview
This report details the findings of a comprehensive QA audit conducted on the MENOMAP React Native application. The audit focused on user flows from registration to daily feature usage, identifying critical usability barriers and functional inconsistencies.

---

## 🚩 List of Issues Found

### Issue #1: Invisible Critical UI Elements
- **Screen**: Brain Fog Tracker
- **Problem**: Multiple elements are configured with white text or components on a white background, making them invisible to the user.
    - Large clarity score text is `#FFFFFF` on a white card.
    - Slider thumb and minimum track are `#FFFFFF` on a white card.
    - "Log Today Entry" button is `#FFFFFF` with `#ffffff` text.
- **Severity**: **Critical**
- **Suggested Improvement**: Update the color palette in `BrainFogMemoryFogScreen.js` to use `colors.primary` or `colors.primaryDark` for interactive elements and text.

### Issue #2: Personalization Failure (Greeting Persistence)
- **Screen**: Home Screen
- **Problem**: The greeting consistently displays "Hi, User" instead of the person's name.
- **Root Cause**: The `RegisterScreen` does not collect the user's name, and the backend defaults it to "User". While the `ProfileScreen` allows setting a name, the `Login` flow bypasses the profile check and uses the server-returned name (which remains "User").
- **Severity**: **Medium**
- **Suggested Improvement**: Add a 'Name' field to the `RegisterScreen` and ensure the server-side user object is updated correctly.

### Issue #3: Cluttered Diet Planner UI
- **Screen**: Diet Planner
- **Problem**: The form is overly long with manual inputs for data that should be known (Age, Region, Menstrual Stage). Additionally, the "Extra Details" section exposes technical jargon ("from 'extra' obj") which is confusing for non-technical users.
- **Severity**: **Medium**
- **Suggested Improvement**: Pre-fill form fields using the `userProfile` from `AsyncStorage`. Rename or hide technical labels like "extra obj".

### Issue #4: Empty State & Manual Doctor Reports
- **Screen**: Doctor Report
- **Problem**: The screen is an empty set of text inputs. It requires the user to manually re-type their trends rather than auto-aggregating data from previous logs.
- **Severity**: **High**
- **Suggested Improvement**: Implement a "Generate Summary" feature that pulls the last 7 days of symptom and relief data into the text fields automatically.

### Issue #5: Broken "Export as PDF" Feature
- **Screen**: Doctor Report
- **Problem**: The primary action button "Export as PDF" triggers a "Coming Soon" alert, providing no actual utility to the user.
- **Severity**: **Medium**
- **Suggested Improvement**: Prioritize the implementation of `expo-print` to generate a basic HTML/PDF summary of the current inputs.

### Issue #6: Lack of Visual Feedback for ML Prediction
- **Screen**: Symptom Tracker
- **Problem**: When clicking "Save & Predict", the only feedback is a text change on the button. There is no `ActivityIndicator` or progress bar.
- **Severity**: **Low**
- **Suggested Improvement**: Add a spinner (`ActivityIndicator`) to the button or a full-screen loading overlay while the API call is in progress.

### Issue #7: Redundant Navigation
- **Screen**: Home Screen
- **Problem**: The custom bottom navigation exists only on the Home Screen. Navigating to a sub-feature (e.g., Diet Planner) removes the navigation bar, forcing the user to use the OS back button or a header back button.
- **Severity**: **Medium**
- **Suggested Improvement**: Refactor the navigation to use a proper `TabNavigator` so the main navigation persists across all top-level features.

---

## 🏆 Top 10 Prioritized Improvements

1.  **FIX VISIBILITY**: Immediately change the colors in `BrainFogMemoryFogScreen.js` so sliders, text, and buttons are visible (White-on-White must be eliminated).
2.  **AUTO-FILL FORM DATA**: Pre-populate the `DietPlanner` and `Profile` screens with known data to reduce friction.
3.  **VALIDATE REGISTRATION**: Add a "Name" field to registration to enable basic app personalization from the first launch.
4.  **INTEGRATED NAVIGATION**: Move to a persistent `TabNavigator` for Home, Reports, and Profile to improve app-wide fluidity.
5.  **SMART REPORTING**: Auto-summarize the last 7 days of logs into the Doctor Report fields.
6.  **ADD SPINNERS**: Ensure all API-connected buttons (Predict, Generate Plan, Login) show a loading spinner during execution.
7.  **STYLE CONSISTENCY**: Standardize on a single `COLORS` constant file rather than re-defining local `COLORS` objects in every screen file.
8.  **EMPTY STATE ILLUSTRATIONS**: Add icons or friendly messages when `Journal` or `Symptom Logs` are empty to guide the user.
9.  **IMPLEMENT BASIC EXPORT**: Use `expo-print` to make the "Export as PDF" button functional, even if only with a simple layout.
10. **REDUCE JARGON**: Remove technical terms like "Encoded", " Ternary", and "Payload" from user-facing screens (especially in Symptom Tracker and Diet Planner).

---
**End of Report**
