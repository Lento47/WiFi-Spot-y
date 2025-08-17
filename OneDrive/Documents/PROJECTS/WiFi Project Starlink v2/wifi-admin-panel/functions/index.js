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

// CORS configuration for development
const corsOptions = {
  origin: [
    'http://localhost:5173',  // Vite dev server
    'http://localhost:3000',  // Alternative dev port
    'http://127.0.0.1:5173', // Alternative localhost
    'http://127.0.0.1:3000'  // Alternative localhost
  ],
  credentials: true
};

// Helper function to add CORS headers
const addCorsHeaders = (response) => {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
};

// --- Email Notification Function (No changes) ---
const gmailEmail = process.env.GMAIL_EMAIL;
const gmailPassword = process.env.GMAIL_PASSWORD;
const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: { user: gmailEmail, pass: gmailPassword },
});

// Function to manually assign card tier to user
exports.assignCardTier = onCall({
  cors: corsOptions
}, async (request) => {
  const { userId, cardTier } = request.data;
  
  if (!userId || !cardTier) {
    throw new HttpsError('invalid-argument', 'userId and cardTier are required');
  }
  
  try {
    const db = getFirestore();
    await db.collection("users").doc(userId).update({
      'cardTier': cardTier,
      'cardTierUpdatedAt': new Date()
    });
    
    log(`Assigned ${cardTier} card tier to user ${userId}`);
    return { success: true, message: `Card tier updated to ${cardTier}` };
  } catch (error) {
    log(`Error assigning card tier to user ${userId}:`, error);
    throw new HttpsError('internal', 'Error updating card tier');
  }
});

// Function to track token usage and consume GB
exports.trackTokenUsage = onCall({
  cors: corsOptions
}, async (request) => {
  const { userId, tokenId, dataUsage, duration, deviceInfo } = request.data;
  
  if (!userId || !tokenId) {
    throw new HttpsError('invalid-argument', 'userId and tokenId are required');
  }
  
  try {
    const db = getFirestore();
    
    // Get user document to check available GB
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }
    
    const userData = userDoc.data();
    // Ensure GB values are numbers, not strings
    const currentGb = parseFloat(userData.credits?.gb) || 0;
    const dataUsageNum = parseFloat(dataUsage) || 0;
    
    // Calculate GB to consume (if dataUsage is provided)
    let gbToConsume = 0;
    if (dataUsageNum > 0) {
      gbToConsume = Math.min(dataUsageNum, currentGb); // Don't consume more than available
    }
    
    // Update user GB credits
    const newGb = Math.max(0, currentGb - gbToConsume);
    

    
    // Create usage record
    const usageData = {
      userId,
      tokenId,
      dataUsage: gbToConsume,
      duration,
      deviceInfo: deviceInfo || {},
      timestamp: new Date(),
      consumedGb: gbToConsume,
      remainingGb: newGb
    };
    
    // Add to usage collection
    await db.collection("tokenUsage").add(usageData);
    
    // Update user GB credits
    await db.collection("users").doc(userId).update({
      'credits.gb': newGb,
      'credits.lastUpdated': new Date()
    });
    
    // Update token status
    await db.collection("wifiTokens").doc(tokenId).update({
      'lastUsed': new Date(),
      'dataConsumed': FieldValue.increment(gbToConsume),
      'isActive': newGb > 0
    });
    
    log(`Tracked token usage for user ${userId}: consumed ${gbToConsume}GB, remaining ${newGb}GB`);
    
    return { 
      success: true, 
      consumedGb: gbToConsume, 
      remainingGb: newGb,
      message: `Usage tracked successfully. Consumed: ${gbToConsume}GB, Remaining: ${newGb}GB`
    };
    
  } catch (error) {
    log(`Error tracking token usage for user ${userId}:`, error);
    throw new HttpsError('internal', 'Error tracking token usage');
  }
});

// Function to get consumption analytics
exports.getConsumptionAnalytics = onCall({
  cors: corsOptions
}, async (request) => {
  const { startDate, endDate, userId } = request.data;
  
  try {
    const db = getFirestore();
    
    let query = db.collection("tokenUsage");
    
    // Add date filters if provided
    if (startDate) {
      query = query.where("timestamp", ">=", new Date(startDate));
    }
    if (endDate) {
      query = query.where("timestamp", "<=", new Date(endDate));
    }
    
    // Add user filter if provided
    if (userId) {
      query = query.where("userId", "==", userId);
    }
    
    const snapshot = await query.get();
    const usageData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Calculate analytics
    const totalGbConsumed = usageData.reduce((sum, usage) => sum + (usage.consumedGb || 0), 0);
    const totalSessions = usageData.length;
    const averageSessionGb = totalSessions > 0 ? totalGbConsumed / totalSessions : 0;
    
    // Group by hour of day
    const hourlyUsage = {};
    usageData.forEach(usage => {
      const hour = new Date(usage.timestamp.toDate()).getHours();
      hourlyUsage[hour] = (hourlyUsage[hour] || 0) + (usage.consumedGb || 0);
    });
    
    // Group by day of week
    const dailyUsage = {};
    usageData.forEach(usage => {
      const day = new Date(usage.timestamp.toDate()).getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      dailyUsage[dayNames[day]] = (dailyUsage[dayNames[day]] || 0) + (usage.consumedGb || 0);
    });
    
    return {
      success: true,
      analytics: {
        totalGbConsumed,
        totalSessions,
        averageSessionGb,
        hourlyUsage,
        dailyUsage,
        usageData: usageData.slice(0, 100) // Limit to last 100 records
      }
    };
    
  } catch (error) {
    log(`Error getting consumption analytics:`, error);
    throw new HttpsError('internal', 'Error getting consumption analytics');
  }
});

// Function to create sample token usage data for testing
exports.createSampleTokenUsage = onCall({
  cors: corsOptions
}, async (request) => {
  try {
    const db = getFirestore();
    
    log('Starting to create sample token usage data...');
    
    // Get all users
    const usersSnapshot = await db.collection("users").get();
    log(`Found ${usersSnapshot.size} users`);
    
    if (usersSnapshot.empty) {
      log('No users found, returning early');
      return { success: false, message: 'No users found' };
    }
    
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    let createdCount = 0;
    
    // Create just a few sample records for testing
    for (const user of users.slice(0, 3)) { // Limit to first 3 users
      try {
        // Create 2-3 sample usage records per user
        const numRecords = Math.floor(Math.random() * 2) + 2;
        
        for (let i = 0; i < numRecords; i++) {
          const timestamp = new Date();
          timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 7)); // Random date in last 7 days
          timestamp.setHours(Math.floor(Math.random() * 24)); // Random hour
          
          const dataUsage = Math.random() * 2 + 0.5; // Random GB between 0.5-2.5
          
          const usageData = {
            userId: user.id,
            tokenId: `sample-token-${user.id}-${i}`,
            dataUsage: dataUsage,
            duration: Math.floor(Math.random() * 60) + 30, // Random duration 30-90 minutes
            deviceInfo: {
              device: 'Sample Device',
              os: 'Sample OS',
              browser: 'Sample Browser'
            },
            timestamp: timestamp,
            consumedGb: dataUsage,
            remainingGb: Math.max(0, (user.credits?.gb || 0) - dataUsage)
          };
          
          await db.collection("tokenUsage").add(usageData);
          createdCount++;
          
          log(`Created sample record ${i + 1} for user ${user.id}`);
        }
      } catch (userError) {
        log(`Error creating records for user ${user.id}:`, userError);
        // Continue with other users
      }
    }
    
    log(`Successfully created ${createdCount} sample token usage records for ${users.length} users`);
    
    return { 
      success: true, 
      message: `Created ${createdCount} sample records`,
      createdCount,
      userCount: users.length
    };
    
  } catch (error) {
    log(`Error creating sample token usage:`, error);
    log(`Error details:`, {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    throw new HttpsError('internal', `Error creating sample token usage: ${error.message}`);
  }
});

exports.onPaymentApproved = onDocumentUpdated("payments/{paymentId}", async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  if (before.status === "pending" && after.status === "approved") {
    const userId = after.userId;
    const db = getFirestore();
    
    try {
      // Get user document
      const userDoc = await db.collection("users").doc(userId).get();
      
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

      // Get package details to add credits
      let packageData = null;
      let hoursToAdd = 0;
      let minutesToAdd = 0;
      
      // Get package ID and name from payment data
      const packageId = after.packageId || after.selectedPackage;
      const packageName = after.packageName;
      const packageType = after.packageType; // New field from payment
      const packageDataAmount = after.packageDataAmount; // New field from payment
      
      log(`Looking for package with ID: ${packageId} and name: ${packageName}`);
      log(`Payment package type: ${packageType}, data amount: ${packageDataAmount}`);
      
      // If payment has package type and data amount, use those directly
      if (packageType && packageType === 'data' && packageDataAmount) {
        log(`Using payment data: type=${packageType}, dataAmount=${packageDataAmount} GB`);
        packageData = {
          type: 'data',
          dataAmount: packageDataAmount,
          name: packageName
        };
      } else {
        // Try to get package by ID
        if (packageId) {
          const packageDoc = await db.collection("timePackages").doc(packageId).get();
          if (packageDoc.exists) {
            packageData = packageDoc.data();
            log(`Found package data for ID ${packageId}:`, packageData);
          } else {
            log(`Package with ID ${packageId} not found`);
          }
        }
        
        // If no package found by ID, try to find by name
        if (!packageData && packageName) {
          log(`Searching for package by name: "${packageName}"`);
          const packagesQuery = await db.collection("timePackages").where("name", "==", packageName).get();
          if (!packagesQuery.empty) {
            packageData = packagesQuery.docs[0].data();
            log(`Found package data by name "${packageName}":`, packageData);
          } else {
            log(`No package found with name "${packageName}"`);
          }
        }
      }
      
      if (!packageData) {
        log(`No package data found for payment. Using fallback calculation.`);
      }
      
      // Calculate credits to add
      if (packageData) {
        // Check if this is a data package or time package
        // First check explicit type field
        let packageType = packageData.type;
        
        // If no explicit type, try to detect from package name or dataAmount field
        if (!packageType) {
          if (packageData.dataAmount || packageData.dataAmount === 0) {
            packageType = 'data';
          } else if (packageName && (packageName.toLowerCase().includes('gb') || packageName.toLowerCase().includes('gigabyte') || packageName.toLowerCase().includes('data'))) {
            packageType = 'data';
          } else {
            packageType = 'time';
          }
        }
        
        log(`Detected package type: ${packageType} for package: ${packageName}`);
        
        if (packageType === 'data') {
          // Data package - add GB
          const gbToAdd = packageData.dataAmount || packageData.duration || 0;
          log(`Data package: ${gbToAdd} GB`);
          
          // Update user data credits - preserve existing credits
          const currentCredits = userData.credits || { hours: 0, minutes: 0, gb: 0 };
          // Ensure GB values are numbers, not strings
          const currentGb = parseFloat(currentCredits.gb) || 0;
          const gbToAddNum = parseFloat(gbToAdd) || 0;
          const newGb = currentGb + gbToAddNum;
          

          
          await db.collection("users").doc(userId).update({
            'credits.gb': newGb,
            'credits.hours': currentCredits.hours || 0,
            'credits.minutes': currentCredits.minutes || 0,
            'credits.lastUpdated': new Date()
          });
          
          log(`Updated user ${userId} data credits: +${gbToAdd} GB. New total: ${newGb} GB`);
          
          // Send approval email for data package
          const mailOptions = {
            from: `"Portal Wi-Fi" <${gmailEmail}>`,
            to: userEmail,
            subject: "¡Tu paquete de datos ha sido aprobado!",
            text: `¡Hola! Tu pago para el paquete de datos "${after.packageName || 'WiFi'}" ha sido aprobado. Se han añadido ${gbToAdd} GB a tu cuenta. Nuevo total: ${newGb} GB. ¡Gracias!`,
          };
          
          await mailTransport.sendMail(mailOptions);
          log("Data package approval email sent to:", userEmail);
          
        } else {
          // Time package - add hours/minutes
          const duration = packageData.duration || 0;
          const durationUnit = packageData.durationUnit || 'hours';
          
          log(`Time package duration: ${duration} ${durationUnit}`);
          
          if (durationUnit === 'hours') {
            hoursToAdd = duration;
          } else if (durationUnit === 'minutes') {
            minutesToAdd = duration;
          } else if (durationUnit === 'days') {
            hoursToAdd = duration * 24;
          } else if (durationUnit === 'weeks') {
            hoursToAdd = duration * 24 * 7;
          } else if (durationUnit === 'months') {
            hoursToAdd = duration * 24 * 30;
          }
          
          log(`Calculated credits from time package: ${hoursToAdd}h ${minutesToAdd}m`);
          
          // Update user time credits - preserve existing GB credits
          const currentCredits = userData.credits || { hours: 0, minutes: 0, gb: 0 };
          // Ensure time values are numbers, not strings
          const currentHours = parseInt(currentCredits.hours) || 0;
          const currentMinutes = parseInt(currentCredits.minutes) || 0;
          const hoursToAddNum = parseInt(hoursToAdd) || 0;
          const minutesToAddNum = parseInt(minutesToAdd) || 0;
          let newHours = currentHours + hoursToAddNum;
          let newMinutes = currentMinutes + minutesToAddNum;
          
          // Convert excess minutes to hours
          if (newMinutes >= 60) {
            newHours += Math.floor(newMinutes / 60);
            newMinutes = newMinutes % 60;
          }

          await db.collection("users").doc(userId).update({
            'credits.hours': newHours,
            'credits.minutes': newMinutes,
            'credits.gb': currentCredits.gb || 0,
            'credits.lastUpdated': new Date()
          });

          log(`Updated user ${userId} time credits: +${hoursToAdd}h ${minutesToAdd}m. New total: ${newHours}h ${newMinutes}m`);

          // Send approval email for time package
          const mailOptions = {
            from: `"Portal Wi-Fi" <${gmailEmail}>`,
            to: userEmail,
            subject: "¡Tu pago ha sido aprobado!",
            text: `¡Hola! Tu pago para el paquete "${after.packageName || 'WiFi'}" ha sido aprobado. Se han añadido ${hoursToAdd}h ${minutesToAdd}m a tu cuenta. Nuevo total: ${newHours}h ${newMinutes}m. ¡Gracias!`,
          };

          await mailTransport.sendMail(mailOptions);
          log("Time package approval email sent to:", userEmail);
        }
      } else {
        // Fallback: convert payment amount to credits (1 hour per 500 CRC)
        const paymentAmount = after.amount || after.packagePrice || 0;
        hoursToAdd = Math.floor(paymentAmount / 500);
        minutesToAdd = Math.floor((paymentAmount % 500) / 8.33); // 8.33 CRC per minute
        
        log(`No package data found, using fallback calculation. Payment amount: ${paymentAmount}, Credits: ${hoursToAdd}h ${minutesToAdd}m`);
        
        // Update user credits with fallback calculation
        const currentCredits = userData.credits || { hours: 0, minutes: 0, gb: 0 };
        // Ensure time values are numbers, not strings
        const currentHours = parseInt(currentCredits.hours) || 0;
        const currentMinutes = parseInt(currentCredits.minutes) || 0;
        const hoursToAddNum = parseInt(hoursToAdd) || 0;
        const minutesToAddNum = parseInt(minutesToAdd) || 0;
        let newHours = currentHours + hoursToAddNum;
        let newMinutes = currentMinutes + minutesToAddNum;
        
        // Convert excess minutes to hours
        if (newMinutes >= 60) {
          newHours += Math.floor(newMinutes / 60);
          newMinutes = newMinutes % 60;
        }

        await db.collection("users").doc(userId).update({
          'credits.hours': newHours,
          'credits.minutes': newMinutes,
          'credits.gb': currentCredits.gb || 0,
          'credits.lastUpdated': new Date()
        });

        log(`Updated user ${userId} credits with fallback: +${hoursToAdd}h ${minutesToAdd}m. New total: ${newHours}h ${newMinutes}m`);

        // Send approval email for fallback
        const mailOptions = {
          from: `"Portal Wi-Fi" <${gmailEmail}>`,
          to: userEmail,
          subject: "¡Tu pago ha sido aprobado!",
          text: `¡Hola! Tu pago ha sido aprobado. Se han añadido ${hoursToAdd}h ${minutesToAdd}m a tu cuenta. Nuevo total: ${newHours}h ${newMinutes}m. ¡Gracias!`,
        };

        await mailTransport.sendMail(mailOptions);
        log("Fallback approval email sent to:", userEmail);
      }

    } catch (error) {
      log(`Error processing payment approval for user ${userId}:`, error);
      console.error("Error in onPaymentApproved:", error);
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