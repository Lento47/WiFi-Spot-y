// firebaseConfig.js
// This file exports the configuration object needed to connect to your Firebase project.
// IMPORTANT: Replace the placeholder values with your actual Firebase project credentials.

// 1. Go to your Firebase project console: https://console.firebase.google.com/
// 2. In your project's settings, find the "SDK setup and configuration" section.
// 3. Select "Config" to see your web app's configuration object.
// 4. Copy the values for each key and paste them here.

export const firebaseConfig = {
  apiKey: "AIzaSyDDP-LppEuxU5bUtffghwakwOyx2a3Xuo8",
  authDomain: "wifi-users---token.firebaseapp.com",
  projectId: "wifi-users---token",
  storageBucket: "wifi-users---token.firebasestorage.app",
  messagingSenderId: "107841385394",
  appId:  "1:107841385394:web:71bcdac1fa11bb79f62aab",
  measurementId: "G-89F3JV5Y3N"
};


// --- Application-wide Settings ---

// Details for your SINPE Móvil account to display to users.
export const sinpeDetails = {
  phone: "72134886",
  name: "Spot You"
};

// Available Wi-Fi plans for users to purchase.
export const timePackages = [
  { id: 'daily', name: 'Pase Diario', price: 3000, duration: 1440 },
  { id: 'weekly', name: 'Pase Semanal', price: 15000, duration: 10080 },
  { id: 'monthly', name: 'Pase Mensual', price: 45000, duration: 43200 },
];