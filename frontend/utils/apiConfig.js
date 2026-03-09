import Constants from "expo-constants";

// Exporting API_URL from environment variable or fallback for development
// Extract the hostname (IP address) from the Expo development server 
// so the mobile app always knows where the backend is located.
const debuggerHost =
    Constants.expoConfig?.hostUri ||
    Constants.manifest?.debuggerHost ||
    "";

// The IP is the part before the colon (e.g., 192.168.x.x)
const host = debuggerHost.split(":").shift() || "localhost";

export const API_URL =
    process.env.EXPO_PUBLIC_API_URL ||
    `http://${host}:5002`;

console.log("Detected API URL:", API_URL);