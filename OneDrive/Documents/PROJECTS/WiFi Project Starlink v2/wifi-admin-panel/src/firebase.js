import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
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
// Your PC's local IP address for Firebase emulator access from phone
const EMULATOR_HOST = "10.0.175.113"; 

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services you need
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to emulators if running in a development environment
// Set this to true to use Firebase emulators (for phone testing)
const USE_EMULATORS = true;

if (import.meta.env.DEV && USE_EMULATORS) {
  console.log(`Connecting to Firebase Emulators at ${EMULATOR_HOST}...`);
  
  // Point the SDKs to the emulators running on your PC
  connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, { 
    disableWarnings: true,
    disableEmulatorWarnings: true
  });
  connectFirestoreEmulator(db, EMULATOR_HOST, 8083);
  connectStorageEmulator(storage, EMULATOR_HOST, 9199);

  // Initialize sample network status data for demonstration
  // Temporarily disabled to avoid permission issues during testing
  // initializeSampleData();
} else {
  console.log('Using real Firebase services');
}

// Function to initialize sample network status data
async function initializeSampleData() {
  try {
    const networkStatusRef = collection(db, "networkStatus");
    
    // Check if we already have data
    const existingData = await getDocs(networkStatusRef);
    if (existingData.size > 0) {
      console.log("Sample data already exists, skipping initialization");
      return;
    }

    console.log("Initializing sample network status data...");
    
    // Generate sample data for the last 24 hours
    const now = new Date();
    const sampleData = [];
    
    for (let i = 1439; i >= 0; i--) { // 1440 minutes = 24 hours
      const timestamp = new Date(now.getTime() - (i * 60 * 1000));
      
      // Generate realistic network data with some variation
      const baseDownload = 150 + Math.random() * 100; // 150-250 Mbps
      const baseUpload = 20 + Math.random() * 15;     // 20-35 Mbps
      const baseLatency = 20 + Math.random() * 30;    // 20-50 ms
      
      // Add some outages and degraded performance
      let status = 'OPERATIONAL';
      let downloadSpeed = baseDownload;
      let uploadSpeed = baseUpload;
      let latency = baseLatency;
      
      if (Math.random() < 0.01) { // 1% chance of outage
        status = 'OUTAGE';
        downloadSpeed = 0;
        uploadSpeed = 0;
        latency = 999;
      } else if (Math.random() < 0.05) { // 5% chance of degraded
        status = 'DEGRADED';
        downloadSpeed = baseDownload * 0.3;
        uploadSpeed = baseUpload * 0.3;
        latency = baseLatency * 2;
      }
      
      sampleData.push({
        timestamp: timestamp,
        status: status,
        downloadSpeed: Math.round(downloadSpeed),
        uploadSpeed: Math.round(uploadSpeed),
        latency: Math.round(latency),
        packetLoss: Math.random() < 0.02 ? Math.random() * 5 : 0, // 2% chance of packet loss
        jitter: Math.random() * 10 // 0-10 ms jitter
      });
    }
    
    // Add documents to Firestore
    for (const data of sampleData) {
      await addDoc(networkStatusRef, {
        ...data,
        timestamp: serverTimestamp()
      });
    }
    
    console.log(`Successfully initialized ${sampleData.length} sample network status records`);
  } catch (error) {
    console.error("Error initializing sample data:", error);
  }
}

export default app;
