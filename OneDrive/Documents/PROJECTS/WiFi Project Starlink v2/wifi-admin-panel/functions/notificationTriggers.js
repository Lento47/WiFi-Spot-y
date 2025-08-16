const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { log } = require("firebase-functions/logger");

// Initialize Firestore
const db = getFirestore();

// Function to create admin notification
const createAdminNotification = async (type, title, description, userInfo = null, additionalData = {}) => {
    try {
        const notification = {
            type,
            title,
            description,
            userInfo,
            isAdminNotification: true,
            isRead: false,
            createdAt: Timestamp.now(),
            ...additionalData
        };

        await db.collection('notifications').add(notification);
        log(`Admin notification created: ${type} - ${title}`);
    } catch (error) {
        log.error('Error creating admin notification:', error);
    }
};

// Function to create user notification
const createUserNotification = async (userId, type, title, description, additionalData = {}) => {
    try {
        const notification = {
            userId,
            type,
            title,
            description,
            isAdminNotification: false,
            isRead: false,
            createdAt: Timestamp.now(),
            ...additionalData
        };

        await db.collection('notifications').add(notification);
        log(`User notification created for ${userId}: ${type} - ${title}`);
    } catch (error) {
        log.error('Error creating user notification:', error);
    }
};

// Function to create @all notification
const createAllUsersNotification = async (type, title, description, fromUserId, additionalData = {}) => {
    try {
        // Get all users
        const usersSnapshot = await db.collection('users').get();
        
        if (usersSnapshot.empty) {
            log('No users found for @all notification');
            return;
        }

        const batch = db.batch();
        const notificationsRef = db.collection('notifications');

        usersSnapshot.docs.forEach(userDoc => {
            const userId = userDoc.id;
            
            // Don't notify the sender
            if (userId === fromUserId) return;

            const notification = {
                userId,
                type,
                title,
                description,
                isAdminNotification: false,
                isRead: false,
                createdAt: Timestamp.now(),
                fromUserId,
                ...additionalData
            };

            const notificationRef = notificationsRef.doc();
            batch.set(notificationRef, notification);
        });

        await batch.commit();
        log(`@all notification created for ${usersSnapshot.size - 1} users: ${type} - ${title}`);
    } catch (error) {
        log.error('Error creating @all notification:', error);
    }
};

// Trigger: New payment submission
exports.onPaymentSubmitted = onDocumentCreated("payments/{paymentId}", async (event) => {
    const paymentData = event.data.data();
    
    if (paymentData.status === 'pending') {
        // Get user info
        let userInfo = null;
        try {
            const userDoc = await db.collection('users').doc(paymentData.userId).get();
            if (userDoc.exists) {
                userInfo = userDoc.data();
            }
        } catch (error) {
            log.error('Error fetching user info for payment notification:', error);
        }

        // Create admin notification
        await createAdminNotification(
            'payment_submission',
            'Nuevo Pago Pendiente',
            `Usuario ${userInfo?.username || userInfo?.email || paymentData.userId} ha enviado un pago de ₡${paymentData.price} por ${paymentData.packageName}`,
            userInfo,
            {
                paymentId: event.params.paymentId,
                amount: paymentData.price,
                packageName: paymentData.packageName,
                sinpeId: paymentData.sinpeId
            }
        );
    }
});

// Trigger: New support ticket
exports.onSupportTicketCreated = onDocumentCreated("supportTickets/{ticketId}", async (event) => {
    const ticketData = event.data.data();
    
    // Get user info
    let userInfo = null;
    try {
        const userDoc = await db.collection('users').doc(ticketData.userId).get();
        if (userDoc.exists) {
            userInfo = userDoc.data();
        }
    } catch (error) {
        log.error('Error fetching user info for support ticket notification:', error);
    }

    // Create admin notification
    await createAdminNotification(
        'support_ticket',
        'Nuevo Ticket de Soporte',
        `Usuario ${userInfo?.username || userInfo?.email || ticketData.userId} ha creado un ticket: ${ticketData.subject}`,
        userInfo,
        {
            ticketId: event.params.ticketId,
            category: ticketData.category,
            priority: ticketData.priority,
            subject: ticketData.subject
        }
    );
});

// Trigger: New bulletin board post
exports.onBulletinPostCreated = onDocumentCreated("bulletinPosts/{postId}", async (event) => {
    const postData = event.data.data();
    
    // Get user info
    let userInfo = null;
    try {
        const userDoc = await db.collection('users').doc(postData.authorId).get();
        if (userDoc.exists) {
            userInfo = userDoc.data();
        }
    } catch (error) {
        log.error('Error fetching user info for bulletin post notification:', error);
    }

    // Create admin notification
    await createAdminNotification(
        'bulletin_post',
        'Nuevo Post en el Mural',
        `Usuario ${userInfo?.username || userInfo?.email || postData.authorId} ha publicado: ${postData.title}`,
        userInfo,
        {
            postId: event.params.postId,
            title: postData.title,
            category: postData.category,
            priority: postData.priority
        }
    );

    // Check for @all mentions
    if (postData.content && postData.content.includes('@all')) {
        await createAllUsersNotification(
            'bulletin_announcement',
            'Anuncio del Mural',
            `${userInfo?.username || userInfo?.email || 'Usuario'} ha publicado un anuncio para todos: ${postData.title}`,
            postData.authorId,
            {
                postId: event.params.postId,
                title: postData.title,
                category: postData.category
            }
        );
    }

    // Check for individual mentions
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentions = postData.content.match(mentionRegex);
    
    if (mentions) {
        const uniqueMentions = [...new Set(mentions)];
        
        for (const mention of uniqueMentions) {
            const username = mention.substring(1);
            
            // Skip @all as it's handled separately
            if (username === 'all') continue;
            
            try {
                const userQuery = await db.collection('users').where('username', '==', username).limit(1).get();
                
                if (!userQuery.empty) {
                    const mentionedUser = userQuery.docs[0];
                    const mentionedUserId = mentionedUser.id;
                    
                    // Don't notify the author
                    if (mentionedUserId === postData.authorId) continue;
                    
                    await createUserNotification(
                        mentionedUserId,
                        'mention',
                        'Te han mencionado',
                        `${userInfo?.username || userInfo?.email || 'Usuario'} te mencionó en el mural: ${postData.title}`,
                        {
                            postId: event.params.postId,
                            fromUserId: postData.authorId,
                            fromUsername: userInfo?.username || userInfo?.email,
                            category: postData.category
                        }
                    );
                }
            } catch (error) {
                log.error(`Error creating mention notification for ${username}:`, error);
            }
        }
    }
});

// Trigger: New referral
exports.onReferralCreated = onDocumentCreated("referrals/{referralId}", async (event) => {
    const referralData = event.data.data();
    
    // Get referrer info
    let referrerInfo = null;
    try {
        const referrerDoc = await db.collection('users').doc(referralData.referrerId).get();
        if (referrerDoc.exists) {
            referrerInfo = referrerDoc.data();
        }
    } catch (error) {
        log.error('Error fetching referrer info for referral notification:', error);
    }

    // Create admin notification
    await createAdminNotification(
        'referral',
        'Nueva Referencia',
        `Usuario ${referrerInfo?.username || referrerInfo?.email || referralData.referrerId} ha referido a ${referralData.referredEmail}`,
        referrerInfo,
        {
            referralId: event.params.referralId,
            referredEmail: referralData.referredEmail,
            relationship: referralData.relationship
        }
    );
});

// Trigger: Payment status change
exports.onPaymentStatusChanged = onDocumentUpdated("payments/{paymentId}", async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    
    // Check if status changed to approved or rejected
    if (before.status !== after.status && (after.status === 'approved' || after.status === 'rejected')) {
        const statusText = after.status === 'approved' ? 'aprobado' : 'rechazado';
        
        // Create user notification
        await createUserNotification(
            after.userId,
            'payment_status',
            `Pago ${statusText}`,
            `Tu pago de ₡${after.price} por ${after.packageName} ha sido ${statusText}`,
            {
                paymentId: event.params.paymentId,
                status: after.status,
                amount: after.price,
                packageName: after.packageName
            }
        );
    }
});

// Trigger: Support ticket status change
exports.onSupportTicketStatusChanged = onDocumentUpdated("supportTickets/{ticketId}", async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    
    // Check if status changed
    if (before.status !== after.status) {
        const statusLabels = {
            'in_progress': 'en progreso',
            'resolved': 'resuelto',
            'closed': 'cerrado'
        };
        
        const statusText = statusLabels[after.status] || after.status;
        
        // Create user notification
        await createUserNotification(
            after.userId,
            'support_status',
            `Ticket ${statusText}`,
            `Tu ticket "${after.subject}" ha sido marcado como ${statusText}`,
            {
                ticketId: event.params.ticketId,
                status: after.status,
                subject: after.subject
            }
        );
    }
    
    // Check if admin replied
    if (!before.adminReply && after.adminReply) {
        await createUserNotification(
            after.userId,
            'admin_reply',
            'Respuesta del Administrador',
            `El administrador ha respondido a tu ticket "${after.subject}"`,
            {
                ticketId: event.params.ticketId,
                subject: after.subject,
                adminReply: after.adminReply.text
            }
        );
    }
});

// Function to manually create notification (callable from admin)
exports.createManualNotification = async (req, res) => {
    try {
        const { type, title, description, userIds, isAdminNotification = false } = req.body;
        
        if (!type || !title || !description) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        
        if (userIds && Array.isArray(userIds)) {
            // Create notifications for specific users
            const batch = db.batch();
            const notificationsRef = db.collection('notifications');
            
            userIds.forEach(userId => {
                const notification = {
                    userId,
                    type,
                    title,
                    description,
                    isAdminNotification: false,
                    isRead: false,
                    createdAt: Timestamp.now(),
                    manual: true
                };
                
                const notificationRef = notificationsRef.doc();
                batch.set(notificationRef, notification);
            });
            
            await batch.commit();
            res.json({ success: true, count: userIds.length });
        } else if (isAdminNotification) {
            // Create admin notification
            await createAdminNotification(type, title, description, null, { manual: true });
            res.json({ success: true, type: 'admin' });
        } else {
            res.status(400).json({ error: 'Invalid notification target' });
        }
    } catch (error) {
        log.error('Error creating manual notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createAdminNotification,
    createUserNotification,
    createAllUsersNotification
};
