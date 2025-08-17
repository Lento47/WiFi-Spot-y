// functions/index.js

const {onDocumentUpdated, onDocumentCreated, onDocumentCreated: onCreate} = require("firebase-functions/v2/firestore");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, Timestamp, FieldValue} = require("firebase-admin/firestore");
const {log} = require("firebase-functions/logger");
const nodemailer = require("nodemailer");
const admin = require('firebase-admin');

initializeApp();

// Import notification triggers AFTER initializing the app
const notificationTriggers = require('./notificationTriggers');

// --- Email Notification Function (No changes) ---
const gmailEmail = process.env.GMAIL_EMAIL;
const gmailPassword = process.env.GMAIL_PASSWORD;
const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: { user: gmailEmail, pass: gmailPassword },
});

exports.onPaymentApproved = onDocumentUpdated("payments/{paymentId}", async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  if (before.status === "pending" && after.status === "approved") {
    const userId = after.userId;
    const userDoc = await getFirestore().collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      log(`User document ${userId} does not exist.`);
      return;
    }
    
    const userData = userDoc.data();
    const userEmail = userData?.email || after.userEmail;

    if (!userEmail) {
      log(`User ${userId} does not have an email.`);
      return;
    }

    const mailOptions = {
      from: `"Portal Wi-Fi" <${gmailEmail}>`,
      to: userEmail,
      subject: "¡Tu pago ha sido aprobado!",
      text: `¡Hola! Tu pago para el paquete "${after.packageName}" ha sido aprobado. Tus créditos han sido añadidos a tu cuenta. ¡Gracias!`,
    };

    try {
      await mailTransport.sendMail(mailOptions);
      log("Approval email sent to:", userEmail);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }
});


// --- NEW: Scheduled Function for Network Status ---

exports.logNetworkStatus = onSchedule("every 5 minutes", async (event) => {
  log("Running scheduled network status log.");

  const db = getFirestore();
  const statusRef = db.collection("networkStatus");

  // Simulate network data
  const isOnline = Math.random() > 0.05; // 95% uptime chance
  const downloadSpeed = isOnline ? 80 + Math.random() * 40 : 0; // 80-120 Mbps
  const uploadSpeed = isOnline ? 10 + Math.random() * 10 : 0; // 10-20 Mbps
  const latency = isOnline ? 25 + Math.random() * 20 : 999; // 25-45 ms

  const newStatus = {
    status: isOnline ? "OPERATIONAL" : "OUTAGE",
    downloadSpeed: parseFloat(downloadSpeed.toFixed(2)),
    uploadSpeed: parseFloat(uploadSpeed.toFixed(2)),
    latency: Math.round(latency),
    timestamp: Timestamp.now(),
  };

  // Add the new status log to the database
  await statusRef.add(newStatus);
  log("New network status logged:", newStatus);

  // To keep the database from growing forever, delete logs older than 24 hours.
  const twentyFourHoursAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
  const oldLogsQuery = db.collection("networkStatus").where("timestamp", "<=", twentyFourHoursAgo);
  
  const oldLogsSnapshot = await oldLogsQuery.get();
  if (oldLogsSnapshot.empty) {
    return;
  }

  const batch = db.batch();
  oldLogsSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  log(`Deleted ${oldLogsSnapshot.size} old status logs.`);
});

// --- NEW: Function to Create Notifications on Mentions ---
exports.onPostCreated = onCreate("posts/{postId}", async (event) => {
    const postData = event.data.data();
    const postText = postData.text;
    const authorUsername = postData.authorUsername;
    const topicName = postData.topicName;

    // Regex to find all @username mentions in the post text
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentions = postText.match(mentionRegex);

    if (!mentions || mentions.length === 0) {
        log("No mentions found in post.");
        return;
    }

    const db = getFirestore();
    const usersRef = db.collection("users");
    const notificationsRef = db.collection("notifications");

    // Create a notification for each unique user mentioned
    const mentionedUsernames = [...new Set(mentions.map(m => m.substring(1)))]; // Get unique usernames without the '@'

    for (const username of mentionedUsernames) {
        const userQuery = await usersRef.where("username", "==", username).limit(1).get();
        
        if (!userQuery.empty) {
            const taggedUser = userQuery.docs[0];
            const taggedUserId = taggedUser.id;

            // Don't notify users if they mention themselves
            if (taggedUserId === postData.authorId) {
                continue;
            }

            const notification = {
                userId: taggedUserId,
                message: `${authorUsername} te mencionó en #${topicName}`,
                isRead: false,
                createdAt: Timestamp.now(),
                link: `/posts/${event.params.postId}` // Optional: for future linking
            };

            await notificationsRef.add(notification);
            log(`Notification created for ${username} (ID: ${taggedUserId})`);
        } else {
            log(`User with username "${username}" not found.`);
        }
    }
});

// Scheduled function for automatic data compaction (runs daily at 2 AM)
// Note: This function is commented out due to Firebase Functions version compatibility
// To enable scheduled functions, upgrade to Firebase Functions v2 or use Cloud Scheduler
/*
exports.scheduledDataCompaction = functions.pubsub
    .schedule('0 2 * * *')
    .timeZone('America/Costa_Rica')
    .onRun(async (context) => {
        try {
            console.log('Starting scheduled data compaction...');
            
            const now = admin.firestore.Timestamp.now();
            const oneWeekAgo = new Date(now.toDate().getTime() - (7 * 24 * 60 * 60 * 1000));
            const oneMonthAgo = new Date(now.toDate().getTime() - (30 * 24 * 60 * 60 * 1000));
            
            // Step 1: Aggregate detailed data to hourly (last 7 days)
            console.log('Aggregating detailed data to hourly...');
            const detailedQuery = db.collection('networkStatus')
                .where('timestamp', '>=', oneWeekAgo)
                .where('timestamp', '<=', now)
                .orderBy('timestamp', 'asc');
            
            const detailedSnapshot = await detailedQuery.get();
            const hourlyData = {};
            
            detailedSnapshot.docs.forEach(doc => {
                const data = doc.data();
                const timestamp = data.timestamp.toDate();
                const hourKey = new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate(), timestamp.getHours());
                
                if (!hourlyData[hourKey.getTime()]) {
                    hourlyData[hourKey.getTime()] = {
                        readings: [],
                        timestamp: hourKey
                    };
                }
                
                hourlyData[hourKey.getTime()].readings.push(data);
            });
            
            // Calculate hourly averages
            const hourlyAverages = Object.values(hourlyData).map(hour => {
                const readings = hour.readings;
                const avgDownload = readings.reduce((sum, r) => sum + (r.downloadSpeed || 0), 0) / readings.length;
                const avgUpload = readings.reduce((sum, r) => sum + (r.uploadSpeed || 0), 0) / readings.length;
                const avgLatency = readings.reduce((sum, r) => sum + (r.latency || 0), 0) / readings.length;
                const avgPacketLoss = readings.reduce((sum, r) => sum + (r.packetLoss || 0), 0) / readings.length;
                const avgJitter = readings.reduce((sum, r) => sum + (r.jitter || 0), 0) / readings.length;
                
                // Determine status based on majority of readings
                const statusCounts = readings.reduce((counts, r) => {
                    counts[r.status] = (counts[r.status] || 0) + 1;
                    return counts;
                }, {});
                const status = Object.entries(statusCounts).reduce((a, b) => statusCounts[a] > statusCounts[b] ? a : b);
                
                return {
                    timestamp: hour.timestamp,
                    status: status,
                    downloadSpeed: Math.round(avgDownload * 100) / 100,
                    uploadSpeed: Math.round(avgUpload * 100) / 100,
                    latency: Math.round(avgLatency * 100) / 100,
                    packetLoss: Math.round(avgPacketLoss * 100) / 100,
                    jitter: Math.round(avgJitter * 100) / 100,
                    readingCount: readings.length,
                    aggregatedAt: now,
                    source: 'scheduled_compaction'
                };
            });
            
            // Save hourly data
            const hourlyPromises = hourlyAverages.map(data => 
                db.collection('networkStatusHourly').add(data)
            );
            await Promise.all(hourlyPromises);
            console.log(`Created ${hourlyAverages.length} hourly records`);
            
            // Step 2: Aggregate hourly data to daily (last 30 days)
            console.log('Aggregating hourly data to daily...');
            const hourlyQuery = db.collection('networkStatusHourly')
                .where('timestamp', '>=', oneMonthAgo)
                .where('timestamp', '<=', now)
                .orderBy('timestamp', 'asc');
            
            const hourlySnapshot = await hourlyQuery.get();
            const dailyData = {};
            
            hourlySnapshot.docs.forEach(doc => {
                const data = doc.data();
                const timestamp = data.timestamp.toDate();
                const dayKey = new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate());
                
                if (!dailyData[dayKey.getTime()]) {
                    dailyData[dayKey.getTime()] = {
                        readings: [],
                        timestamp: dayKey
                    };
                }
                
                dailyData[dayKey.getTime()].readings.push(data);
            });
            
            // Calculate daily averages
            const dailyAverages = Object.values(dailyData).map(day => {
                const readings = day.readings;
                const avgDownload = readings.reduce((sum, r) => sum + (r.downloadSpeed || 0), 0) / readings.length;
                const avgUpload = readings.reduce((sum, r) => sum + (r.uploadSpeed || 0), 0) / readings.length;
                const avgLatency = readings.reduce((sum, r) => sum + (r.latency || 0), 0) / readings.length;
                const avgPacketLoss = readings.reduce((sum, r) => sum + (r.packetLoss || 0), 0) / readings.length;
                const avgJitter = readings.reduce((sum, r) => sum + (r.jitter || 0), 0) / readings.length;
                
                // Calculate uptime percentage
                const operationalCount = readings.filter(r => r.status === 'OPERATIONAL').length;
                const uptimePercent = (operationalCount / readings.length) * 100;
                
                // Determine status based on uptime
                let status = 'OPERATIONAL';
                if (uptimePercent < 50) status = 'OUTAGE';
                else if (uptimePercent < 90) status = 'DEGRADED';
                
                return {
                    timestamp: day.timestamp,
                    status: status,
                    downloadSpeed: Math.round(avgDownload * 100) / 100,
                    uploadSpeed: Math.round(avgUpload * 100) / 100,
                    latency: Math.round(avgLatency * 100) / 100,
                    packetLoss: Math.round(avgPacketLoss * 100) / 100,
                    jitter: Math.round(avgJitter * 100) / 100,
                    uptimePercent: Math.round(uptimePercent * 100) / 100,
                    readingCount: readings.length,
                    aggregatedAt: now,
                    source: 'scheduled_compaction'
                };
            });
            
            // Save daily data
            const dailyPromises = dailyAverages.map(data => 
                db.collection('networkStatusDaily').add(data)
            );
            await Promise.all(dailyPromises);
            console.log(`Created ${dailyAverages.length} daily records`);
            
            // Step 3: Clean up old detailed data (keep only last 7 days)
            console.log('Cleaning up old detailed data...');
            const oldDetailedQuery = db.collection('networkStatus')
                .where('timestamp', '<', oneWeekAgo)
                .orderBy('timestamp', 'asc')
                .limit(1000); // Process in batches
            
            const oldDetailedSnapshot = await oldDetailedQuery.get();
            const detailedDeletions = oldDetailedSnapshot.docs.map(doc => doc.ref.delete());
            await Promise.all(detailedDeletions);
            console.log(`Deleted ${oldDetailedSnapshot.docs.length} old detailed records`);
            
            // Step 4: Clean up old hourly data (keep only last 30 days)
            console.log('Cleaning up old hourly data...');
            const oldHourlyQuery = db.collection('networkStatusHourly')
                .where('timestamp', '<', oneMonthAgo)
                .orderBy('timestamp', 'asc')
                .limit(1000);
            
            const oldHourlySnapshot = await oldHourlyQuery.get();
            const hourlyDeletions = oldHourlySnapshot.docs.map(doc => doc.ref.delete());
            await Promise.all(hourlyDeletions);
            console.log(`Deleted ${oldHourlySnapshot.docs.length} old hourly records`);
            
            // Log the compaction
            await db.collection('systemLogs').add({
                type: 'scheduled_data_compaction',
                timestamp: now,
                details: {
                    hourlyRecordsCreated: hourlyAverages.length,
                    dailyRecordsCreated: dailyAverages.length,
                    detailedRecordsDeleted: oldDetailedSnapshot.docs.length,
                    hourlyRecordsDeleted: oldHourlySnapshot.docs.length,
                    executionTime: new Date().toISOString()
                }
            });
            
            console.log('Scheduled data compaction completed successfully');
            return { success: true, recordsProcessed: hourlyAverages.length + dailyAverages.length };
            
        } catch (error) {
            console.error('Error during scheduled data compaction:', error);
            
            // Log the error
            await db.collection('systemLogs').add({
                type: 'scheduled_data_compaction_error',
                timestamp: admin.firestore.Timestamp.now(),
                error: error.message,
                stack: error.stack,
                executionTime: new Date().toISOString()
            });
            
            throw error;
        }
    });
*/

// Manual data compaction function (can be called via HTTP)
exports.manualDataCompaction = onCall(async (data, context) => {
    try {
        console.log('Starting manual data compaction...');

    const db = getFirestore();
        const now = Timestamp.now();
        const oneWeekAgo = new Date(now.toMillis() - (7 * 24 * 60 * 60 * 1000));
        const oneMonthAgo = new Date(now.toMillis() - (30 * 24 * 60 * 60 * 1000));
        
        // Step 1: Aggregate detailed data to hourly (last 7 days)
        console.log('Aggregating detailed data to hourly...');
        const detailedQuery = db.collection('networkStatus')
            .where('timestamp', '>=', oneWeekAgo)
            .where('timestamp', '<=', now)
            .orderBy('timestamp', 'asc');
        
        const detailedSnapshot = await detailedQuery.get();
        const hourlyData = {};
        
        detailedSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const timestamp = data.timestamp.toDate();
            const hourKey = new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate(), timestamp.getHours());
            
            if (!hourlyData[hourKey.getTime()]) {
                hourlyData[hourKey.getTime()] = {
                    readings: [],
                    timestamp: hourKey
                };
            }
            
            hourlyData[hourKey.getTime()].readings.push(data);
        });
        
        // Calculate hourly averages
        const hourlyAverages = Object.values(hourlyData).map(hour => {
            const readings = hour.readings;
            const avgDownload = readings.reduce((sum, r) => sum + (r.downloadSpeed || 0), 0) / readings.length;
            const avgUpload = readings.reduce((sum, r) => sum + (r.uploadSpeed || 0), 0) / readings.length;
            const avgLatency = readings.reduce((sum, r) => sum + (r.latency || 0), 0) / readings.length;
            const avgPacketLoss = readings.reduce((sum, r) => sum + (r.packetLoss || 0), 0) / readings.length;
            const avgJitter = readings.reduce((sum, r) => sum + (r.jitter || 0), 0) / readings.length;
            
            // Determine status based on majority of readings
            const statusCounts = readings.reduce((counts, r) => {
                counts[r.status] = (counts[r.status] || 0) + 1;
                return counts;
            }, {});
            const status = Object.entries(statusCounts).reduce((a, b) => statusCounts[a] > statusCounts[b] ? a : b);
            
            return {
                timestamp: hour.timestamp,
                status: status,
                downloadSpeed: Math.round(avgDownload * 100) / 100,
                uploadSpeed: Math.round(avgUpload * 100) / 100,
                latency: Math.round(avgLatency * 100) / 100,
                packetLoss: Math.round(avgPacketLoss * 100) / 100,
                jitter: Math.round(avgJitter * 100) / 100,
                readingCount: readings.length,
                aggregatedAt: now,
                source: 'manual_compaction'
            };
        });
        
        // Save hourly data
        const hourlyPromises = hourlyAverages.map(data => 
            db.collection('networkStatusHourly').add(data)
        );
        await Promise.all(hourlyPromises);
        console.log(`Created ${hourlyAverages.length} hourly records`);
        
        // Step 2: Aggregate hourly data to daily (last 30 days)
        console.log('Aggregating hourly data to daily...');
        const hourlyQuery = db.collection('networkStatusHourly')
            .where('timestamp', '>=', oneMonthAgo)
            .where('timestamp', '<=', now)
            .orderBy('timestamp', 'asc');
        
        const hourlySnapshot = await hourlyQuery.get();
        const dailyData = {};
        
        hourlySnapshot.docs.forEach(doc => {
            const data = doc.data();
            const timestamp = data.timestamp.toDate();
            const dayKey = new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate());
            
            if (!dailyData[dayKey.getTime()]) {
                dailyData[dayKey.getTime()] = {
                    readings: [],
                    timestamp: dayKey
                };
            }
            
            dailyData[dayKey.getTime()].readings.push(data);
        });
        
        // Calculate daily averages
        const dailyAverages = Object.values(dailyData).map(day => {
            const readings = day.readings;
            const avgDownload = readings.reduce((sum, r) => sum + (r.downloadSpeed || 0), 0) / readings.length;
            const avgUpload = readings.reduce((sum, r) => sum + (r.uploadSpeed || 0), 0) / readings.length;
            const avgLatency = readings.reduce((sum, r) => sum + (r.latency || 0), 0) / readings.length;
            const avgPacketLoss = readings.reduce((sum, r) => sum + (r.packetLoss || 0), 0) / readings.length;
            const avgJitter = readings.reduce((sum, r) => sum + (r.jitter || 0), 0) / readings.length;
            
            // Determine status based on majority of readings
            const statusCounts = readings.reduce((counts, r) => {
                counts[r.status] = (counts[r.status] || 0) + 1;
                return counts;
            }, {});
            const status = Object.entries(statusCounts).reduce((a, b) => statusCounts[a] > statusCounts[b] ? a : b);
            
            return {
                timestamp: day.timestamp,
                status: status,
                downloadSpeed: Math.round(avgDownload * 100) / 100,
                uploadSpeed: Math.round(avgUpload * 100) / 100,
                latency: Math.round(avgLatency * 100) / 100,
                packetLoss: Math.round(avgPacketLoss * 100) / 100,
                jitter: Math.round(avgJitter * 100) / 100,
                readingCount: readings.length,
                aggregatedAt: now,
                source: 'manual_compaction'
            };
        });
        
        // Save daily data
        const dailyPromises = dailyAverages.map(data => 
            db.collection('networkStatusDaily').add(data)
        );
        await Promise.all(dailyPromises);
        console.log(`Created ${dailyAverages.length} daily records`);
        
        // Step 3: Clean up old detailed data (older than 7 days)
        console.log('Cleaning up old detailed data...');
        const cleanupQuery = db.collection('networkStatus')
            .where('timestamp', '<', oneWeekAgo);
        
        const cleanupSnapshot = await cleanupQuery.get();
        const cleanupPromises = cleanupSnapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(cleanupPromises);
        console.log(`Cleaned up ${cleanupSnapshot.docs.length} old detailed records`);
        
        // Step 4: Clean up old hourly data (older than 30 days)
        console.log('Cleaning up old hourly data...');
        const hourlyCleanupQuery = db.collection('networkStatusHourly')
            .where('timestamp', '<', oneMonthAgo);
        
        const hourlyCleanupSnapshot = await hourlyCleanupQuery.get();
        const hourlyCleanupPromises = hourlyCleanupSnapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(hourlyCleanupPromises);
        console.log(`Cleaned up ${hourlyCleanupSnapshot.docs.length} old hourly records`);
        
        console.log('Data compaction completed successfully');
        return { success: true, message: 'Data compaction completed successfully' };
        
    } catch (error) {
        console.error('Error during data compaction:', error);
        throw new HttpsError('internal', 'Error during data compaction');
    }
});

// Function to process referral rewards when a new user registers
exports.processReferralReward = onCreate("users/{userId}", async (event) => {
    try {
        const newUser = event.data.data();
        console.log('New user data:', JSON.stringify(newUser));
        
        const referralCode = newUser.referralCode;
        console.log('Referral code found:', referralCode);
        
        if (!referralCode) {
            console.log('No referral code found for new user');
            return null;
        }
        
        // Check if this referral code has already been used by this user
        // This prevents duplicate usage of the same code
        const db = getFirestore();
        const existingReferralCheck = await db.collection('referrals')
            .where('referredEmail', '==', newUser.email)
            .where('referralCode', '==', referralCode)
            .where('status', '==', 'successful')
            .get();
        
        if (!existingReferralCheck.empty) {
            console.log('Referral code already used by this user:', referralCode);
            return null;
        }
        
        // Find the referrer by referral code
        const usersRef = db.collection('users');
        const referrerQuery = await usersRef.where('referralCode', '==', referralCode).get();
        
        if (referrerQuery.empty) {
            console.log('Referrer not found for code:', referralCode);
            return null;
        }
        
        const referrer = referrerQuery.docs[0];
        const referrerId = referrer.id;
        console.log('Found referrer:', referrerId, 'for code:', referralCode);
        console.log('Referrer document data:', JSON.stringify(referrer.data()));
        console.log('New user ID:', event.params.userId);
        console.log('Referrer ID:', referrerId);
        console.log('Self-referral check:', referrerId === event.params.userId);
        
        // Prevent self-referral - check if the new user is trying to use their own referral code
        if (referrerId === event.params.userId) {
            console.log('User cannot refer themselves - referrerId matches new userId');
            console.log('This means the new user is trying to use their own referral code');
            return null;
        }
        
        // Find the pending referral
        const referralsRef = db.collection('referrals');
        const referralQuery = await referralsRef
            .where('referrerId', '==', referrerId)
            .where('referredEmail', '==', newUser.email)
            .where('status', '==', 'pending')
            .get();
        
        if (!referralQuery.empty) {
            // Update existing pending referral
            const referral = referralQuery.docs[0];
            const referralId = referral.id;
            
            // Update referral status to successful
            await referralsRef.doc(referralId).update({
                status: 'successful',
                updatedAt: Timestamp.now(),
                creditReward: 60, // Default 60 minutes
                creditAwardedAt: Timestamp.now(),
                newUserId: event.params.userId,
                newUserEmail: newUser.email,
                newUsername: newUser.username || newUser.email.split('@')[0] + '_temp'
            });
            
            // Award credits to referrer
            await usersRef.doc(referrerId).update({
                creditsMinutes: FieldValue.increment(60)
            });
            
            console.log(`Referral successful: ${referrerId} referred ${newUser.email}, awarded 60 credits`);
            
            // Create notification for referrer
            await db.collection('notifications').add({
                toUserId: referrerId,
                fromUserId: event.params.userId,
                fromUsername: newUser.username || newUser.email.split('@')[0] + '_temp',
                type: 'referral_successful',
                title: '¡Referencia Exitosa!',
                message: `Tu referencia ${newUser.username || newUser.email.split('@')[0] + '_temp'} se registró exitosamente. Has recibido 60 créditos de WiFi.`,
                createdAt: Timestamp.now(),
                read: false,
                isAdminNotification: false
            });

            return { success: true, referralId, creditsAwarded: 60 };
        } else {
            // Create a new referral record if none exists
            const newReferralRef = await referralsRef.add({
                referrerId: referrerId,
                referrerEmail: referrer.data().email,
                referrerName: referrer.data().username || referrer.data().email,
                referredEmail: newUser.email,
                referredName: newUser.username || newUser.email.split('@')[0] + '_temp',
                referralCode: referralCode,
                status: 'successful',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                creditReward: 60,
                creditAwardedAt: Timestamp.now(),
                newUserId: event.params.userId,
                newUserEmail: newUser.email,
                newUsername: newUser.username || newUser.email.split('@')[0] + '_temp',
                relationship: 'automatic',
                notes: 'Referencia automática al registrarse'
            });
            
            // Award credits to referrer
            await usersRef.doc(referrerId).update({
                creditsMinutes: FieldValue.increment(60)
            });
            
            console.log(`New referral created and successful: ${referrerId} referred ${newUser.email}, awarded 60 credits`);
            
            // Create notification for referrer
            await db.collection('notifications').add({
                toUserId: referrerId,
                fromUserId: event.params.userId,
                fromUsername: newUser.username || newUser.email.split('@')[0] + '_temp',
                type: 'referral_successful',
                title: '¡Referencia Exitosa!',
                message: `Tu referencia ${newUser.username || newUser.email.split('@')[0] + '_temp'} se registró exitosamente. Has recibido 60 créditos de WiFi.`,
                createdAt: Timestamp.now(),
                read: false,
                isAdminNotification: false
            });
            
            return { success: true, referralId: newReferralRef.id, creditsAwarded: 60 };
        }
        
    } catch (error) {
        console.error('Error processing referral reward:', error);
        throw error;
    }
});

// Test function to manually process referrals (for testing)
exports.testReferralProcess = onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new HttpsError('unauthenticated', 'User must be authenticated');
        }

        const { userId, referralCode } = data;
        if (!userId || !referralCode) {
            throw new HttpsError('invalid-argument', 'userId and referralCode are required');
        }

        const db = getFirestore();
        
        // Get the user document
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new HttpsError('not-found', 'User not found');
        }

        const userData = userDoc.data();
        console.log('Testing referral for user:', userId, 'with code:', referralCode);
        console.log('User data:', JSON.stringify(userData));

        // Find the referrer by referral code
        const referrerQuery = await db.collection('users').where('referralCode', '==', referralCode).get();
        
        if (referrerQuery.empty) {
            throw new HttpsError('not-found', 'Referrer not found for code: ' + referralCode);
        }

        const referrer = referrerQuery.docs[0];
        const referrerId = referrer.id;
        
        // Prevent self-referral
        if (referrerId === userId) {
            throw new HttpsError('invalid-argument', 'User cannot refer themselves');
        }

        // Award credits to referrer
        await db.collection('users').doc(referrerId).update({
            creditsMinutes: FieldValue.increment(60)
        });

        // Create referral record
        const referralRef = await db.collection('referrals').add({
            referrerId: referrerId,
            referrerEmail: referrer.data().email,
            referrerName: referrer.data().username || referrer.data().email,
            referredEmail: userData.email,
            referredName: userData.username || 'Test User',
            referralCode: referralCode,
            status: 'successful',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            creditReward: 60,
            creditAwardedAt: Timestamp.now(),
            newUserId: userId,
            newUserEmail: userData.email,
            newUsername: userData.username,
            relationship: 'test',
            notes: 'Test referral processing'
        });

        // Create notification
        await db.collection('notifications').add({
            toUserId: referrerId,
            fromUserId: userId,
            fromUsername: userData.username || 'Test User',
            type: 'referral_successful',
            title: '¡Referencia Exitosa!',
            message: `Tu referencia ${userData.username || userData.email} se registró exitosamente. Has recibido 60 créditos de WiFi.`,
            createdAt: Timestamp.now(),
            read: false,
            isAdminNotification: false
        });

        console.log(`Test referral successful: ${referrerId} referred ${userData.email}, awarded 60 credits`);

        return { 
            success: true, 
            referralId: referralRef.id, 
            creditsAwarded: 60,
            referrerId: referrerId,
            message: 'Referral processed successfully'
        };

    } catch (error) {
        console.error('Error in test referral process:', error);
        throw new HttpsError('internal', error.message);
    }
});

// Debug function to check referral system state
exports.debugReferralSystem = onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new HttpsError('unauthenticated', 'User must be authenticated');
        }

        const { referralCode } = data;
        if (!referralCode) {
            throw new HttpsError('invalid-argument', 'referralCode is required');
        }

        const db = getFirestore();
        
        // Find the referrer by referral code
        const referrerQuery = await db.collection('users').where('referralCode', '==', referralCode).get();
        
        if (referrerQuery.empty) {
            return { 
                success: false, 
                message: 'Referrer not found for code: ' + referralCode,
                referralCode: referralCode
            };
        }

        const referrer = referrerQuery.docs[0];
        const referrerData = referrer.data();
        
        // Get all users with this referral code
        const allUsersWithCode = await db.collection('users').where('referralCode', '==', referralCode).get();
        const usersWithCode = allUsersWithCode.docs.map(doc => ({
            userId: doc.id,
            email: doc.data().email,
            username: doc.data().username,
            referralCode: doc.data().referralCode
        }));

        return { 
            success: true, 
            referralCode: referralCode,
            referrer: {
                userId: referrer.id,
                email: referrerData.email,
                username: referrerData.username,
                referralCode: referrerData.referralCode
            },
            allUsersWithThisCode: usersWithCode,
            message: 'Referral system debug info retrieved'
        };

    } catch (error) {
        console.error('Error in debug referral system:', error);
        throw new HttpsError('internal', error.message);
    }
});

// Export notification triggers
exports.onPaymentSubmitted = notificationTriggers.onPaymentSubmitted;
exports.onSupportTicketCreated = notificationTriggers.onSupportTicketCreated;
exports.onBulletinPostCreated = notificationTriggers.onBulletinPostCreated;
exports.onReferralCreated = notificationTriggers.onReferralCreated;
exports.onPaymentStatusChanged = notificationTriggers.onPaymentStatusChanged;
exports.onSupportTicketStatusChanged = notificationTriggers.onSupportTicketStatusChanged;