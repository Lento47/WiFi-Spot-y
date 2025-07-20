// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyDDP-LppEuxU5bUtffghwakwOyx2a3Xuo8",
  authDomain: "wifi-users---token.firebaseapp.com",
  projectId: "wifi-users---token",
  storageBucket: "wifi-users---token.firebasestorage.app",
  messagingSenderId: "107841385394",
  appId: "1:107841385394:web:71bcdac1fa11bb79f62aab",
  measurementId: "G-89F3JV5Y3N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };