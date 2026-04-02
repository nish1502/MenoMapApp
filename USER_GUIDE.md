# 🌸 MenoMap: Getting Started Guide

Welcome to **MenoMap**! This guide is designed for someone who is completely new to technology. We will walk you through setting up the application step-by-step.

---

## 1. What is MenoMap?
MenoMap is a helpful tool designed to support women during menopause. It uses Artificial Intelligence (AI) to:
*   Predict which stage of menopause you are in.
*   Suggest personalized diet plans based on your symptoms.
*   Recommend natural relief methods like specific yoga or supplements.

---

## 2. Things You Need on Your Computer
Before we start, you need to install three basic "engines" that make the app run. Click the links below to download and install them (just like any other software):

1.  **Python**: The engine for the AI. [Download here](https://www.python.org/downloads/) (Version 3.10 or higher).
2.  **Node.js**: The engine that runs the mobile app part. [Download here](https://nodejs.org/) (Version 18 or higher).
3.  **Git**: A tool that helps you download the project code. [Download here](https://git-scm.com/downloads).

---

## 3. Downloading the Code
1.  Open your computer's **Terminal** (on Mac, press `Command + Space` and type "Terminal"; on Windows, search for "Command Prompt").
2.  Copy and paste this command and press Enter:
    ```bash
    git clone https://github.com/nish1502/MenoMapApp.git
    ```
3.  Enter the project folder:
    ```bash
    cd MenoMapApp
    ```

---

## 4. Setting up the "Brain" (Backend)
The "backend" is where the AI and data live.
1.  In your terminal, move into the backend folder:
    ```bash
    cd backend
    ```
2.  Install the necessary AI parts (this might take a minute):
    ```bash
    pip install -r requirements.txt
    ```
3.  Start the brain:
    ```bash
    python app.py
    ```
    *Keep this terminal window open!* If you close it, the app's brain stops working.

---

## 5. Setting up the "App" (Frontend)
The "frontend" is what you see and touch on your phone.
1.  Open a **NEW** terminal window.
2.  Go back to the project folder:
    ```bash
    cd MenoMapApp/frontend
    ```
3.  Install the app files:
    ```bash
    npm install
    ```
4.  **The Secret Key (Important!)**: 
    Because we keep your secrets safe, we don't put the "API Key" on the internet. You need to create a small file:
    *   In the `frontend` folder, create a new file named exactly `.env`.
    *   Paste this inside it: `EXPO_PUBLIC_OPENROUTER_API_KEY=your_key_here` (ask the project owner for the key).

5.  Start the app:
    ```bash
    npx expo start
    ```

---

## 6. How to see it on your phone
1.  Download the **"Expo Go"** app from the Apple App Store or Google Play Store on your phone.
2.  In your terminal, you will see a large **QR Code**.
3.  Open your phone's camera (or the Expo Go app) and scan that QR code.
4.  Wait for the app to "build"—and you're ready to use MenoMap!

---

## 🚀 Troubleshooting
*   **"Command not found"**: Make sure you installed Python, Node.js, and Git from Step 2.
*   **App is blank**: Ensure the "Brain" (Step 4) is still running in its own terminal window.
*   **AI doesn't answer**: Check that you added your "Secret Key" in Step 5.
