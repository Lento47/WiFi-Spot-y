const {onDocumentUpdated} = require("firebase-functions/v2/firestore");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onRequest} = require("firebase-functions/v2/https"); // Import onRequest
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, Timestamp} = require("firebase-admin/firestore");
const {log} = require("firebase-functions/logger");
const nodemailer = require("nodemailer");

initializeApp();

// --- Email Notification Function (No changes) ---
const gmailEmail = process.env.GMAIL_EMAIL;
const gmailPassword = process.env.GMAIL_PASSWORD;
// ... (rest of email code is unchanged)

// --- Scheduled Function for Network Status (Keep this for when you upgrade) ---
exports.logNetworkStatus = onSchedule("every 5 minutes", async (event) => {
  // ... (existing scheduled function code)
});


// --- NEW: Manually Triggered Function for Testing ---
exports.testLogNetworkStatus = onRequest(async (req, res) => {
  log("Manually triggering network status log.");

  const db = getFirestore();
  const statusRef = db.collection("networkStatus");

  // Simulate network data
  const isOnline = Math.random() > 0.05;
  const downloadSpeed = isOnline ? 80 + Math.random() * 40 : 0;
  const uploadSpeed = isOnline ? 10 + Math.random() * 10 : 0;
  const latency = isOnline ? 25 + Math.random() * 20 : 999;

  const newStatus = {
    status: isOnline ? "OPERATIONAL" : "OUTAGE",
    downloadSpeed: parseFloat(downloadSpeed.toFixed(2)),
    uploadSpeed: parseFloat(uploadSpeed.toFixed(2)),
    latency: Math.round(latency),
    timestamp: Timestamp.now(),
  };

  await statusRef.add(newStatus);
  log("Manual network status logged:", newStatus);
  
  res.send("Successfully logged a new network status point.");
});
