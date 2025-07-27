import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Your project's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDDP-LppEuxU5bUtffghwakwOyx2a3Xuo8",
  authDomain: "wifi-users---token.firebaseapp.com",
  projectId: "wifi-users---token",
  storageBucket: "wifi-users---token.appspot.com",
  messagingSenderId: "107841385394",
  appId: "1:107841385394:web:71bcdac1fa11bb79f62aab",
  measurementId: "G-89F3JV5Y3N"
};

// --- IMPORTANT ---
// This is your PC's local IP address from the Vite server output.
const EMULATOR_HOST = "10.0.175.113"; 

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services you need
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to emulators if running in a development environment
if (import.meta.env.DEV) {
  console.log(`Connecting to Firebase Emulators at ${EMULATOR_HOST}...`);
  
  // Point the SDKs to the emulators running on your PC
  connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`);
  connectFirestoreEmulator(db, EMULATOR_HOST, 8080);
  connectStorageEmulator(storage, EMULATOR_HOST, 9199);
}

export default app;
