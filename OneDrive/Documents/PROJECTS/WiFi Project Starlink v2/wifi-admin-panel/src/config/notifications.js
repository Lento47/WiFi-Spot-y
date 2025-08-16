// Notification System Configuration
export const NOTIFICATION_CONFIG = {
    // Notification Types
    types: {
        // User submission notifications (for admins)
        payment_submission: {
            label: 'Nuevo Pago',
            description: 'Usuario ha enviado un pago pendiente',
            priority: 'high',
            icon: 'payment',
            color: 'blue',
            autoExpire: false
        },
        support_ticket: {
            label: 'Ticket de Soporte',
            description: 'Usuario ha creado un ticket de soporte',
            priority: 'medium',
            icon: 'support',
            color: 'green',
            autoExpire: false
        },
        bulletin_post: {
            label: 'Nuevo Post',
            description: 'Usuario ha publicado en el mural',
            priority: 'low',
            icon: 'bulletin',
            color: 'purple',
            autoExpire: false
        },
        referral: {
            label: 'Nueva Referencia',
            description: 'Usuario ha referido a alguien',
            priority: 'medium',
            icon: 'referral',
            color: 'orange',
            autoExpire: false
        },

        // User notifications (for users)
        payment_status: {
            label: 'Estado del Pago',
            description: 'Tu pago ha sido procesado',
            priority: 'high',
            icon: 'payment',
            color: 'blue',
            autoExpire: true,
            expireHours: 24
        },
        support_status: {
            label: 'Estado del Ticket',
            description: 'Tu ticket ha sido actualizado',
            priority: 'medium',
            icon: 'support',
            color: 'green',
            autoExpire: true,
            expireHours: 48
        },
        admin_reply: {
            label: 'Respuesta del Admin',
            description: 'El administrador ha respondido',
            priority: 'high',
            icon: 'admin',
            color: 'blue',
            autoExpire: true,
            expireHours: 72
        },
        mention: {
            label: 'Mención',
            description: 'Alguien te ha mencionado',
            priority: 'low',
            icon: 'mention',
            color: 'yellow',
            autoExpire: true,
            expireHours: 168 // 1 week
        },
        bulletin_announcement: {
            label: 'Anuncio del Mural',
            description: 'Nuevo anuncio para todos los usuarios',
            priority: 'medium',
            icon: 'announcement',
            color: 'purple',
            autoExpire: true,
            expireHours: 168 // 1 week
        }
    },

    // Notification Priorities
    priorities: {
        low: {
            label: 'Baja',
            color: 'gray',
            icon: 'circle'
        },
        medium: {
            label: 'Media',
            color: 'yellow',
            icon: 'exclamation'
        },
        high: {
            label: 'Alta',
            color: 'red',
            icon: 'exclamation-triangle'
        }
    },

    // Auto-expiration settings
    autoExpiration: {
        enabled: true,
        defaultExpireHours: 168, // 1 week
        cleanupInterval: 24, // hours
        batchSize: 100
    },

    // Display settings
    display: {
        maxNotifications: 50,
        maxPreviewLength: 100,
        showTimestamp: true,
        showUserInfo: true,
        showActions: true,
        enableSound: false,
        enableDesktop: false
    },

    // Batch operations
    batch: {
        maxBatchSize: 500,
        maxConcurrentBatches: 3,
        batchTimeout: 30000 // 30 seconds
    },

    // Rate limiting
    rateLimit: {
        maxNotificationsPerUser: 100,
        maxNotificationsPerHour: 10,
        maxMentionsPerPost: 20
    }
};

// Notification templates
export const NOTIFICATION_TEMPLATES = {
    // Payment notifications
    payment_submitted: (userInfo, amount, packageName) => ({
        title: 'Nuevo Pago Pendiente',
        description: `Usuario ${userInfo?.username || userInfo?.email || 'Desconocido'} ha enviado un pago de ₡${amount} por ${packageName}`,
        type: 'payment_submission',
        priority: 'high'
    }),

    payment_approved: (amount, packageName) => ({
        title: 'Pago Aprobado',
        description: `Tu pago de ₡${amount} por ${packageName} ha sido aprobado. Tus créditos han sido añadidos a tu cuenta.`,
        type: 'payment_status',
        priority: 'high'
    }),

    payment_rejected: (amount, packageName, reason) => ({
        title: 'Pago Rechazado',
        description: `Tu pago de ₡${amount} por ${packageName} ha sido rechazado. Razón: ${reason || 'No especificada'}`,
        type: 'payment_status',
        priority: 'high'
    }),

    // Support notifications
    support_ticket_created: (userInfo, subject) => ({
        title: 'Nuevo Ticket de Soporte',
        description: `Usuario ${userInfo?.username || userInfo?.email || 'Desconocido'} ha creado un ticket: ${subject}`,
        type: 'support_ticket',
        priority: 'medium'
    }),

    support_ticket_updated: (subject, status) => ({
        title: 'Ticket Actualizado',
        description: `Tu ticket "${subject}" ha sido marcado como ${status}`,
        type: 'support_status',
        priority: 'medium'
    }),

    admin_reply: (subject) => ({
        title: 'Respuesta del Administrador',
        description: `El administrador ha respondido a tu ticket "${subject}"`,
        type: 'admin_reply',
        priority: 'high'
    }),

    // Bulletin board notifications
    bulletin_post_created: (userInfo, title) => ({
        title: 'Nuevo Post en el Mural',
        description: `Usuario ${userInfo?.username || userInfo?.email || 'Desconocido'} ha publicado: ${title}`,
        type: 'bulletin_post',
        priority: 'low'
    }),

    mention: (fromUser, title, category) => ({
        title: 'Te han mencionado',
        description: `${fromUser?.username || fromUser?.email || 'Usuario'} te mencionó en el mural: ${title}`,
        type: 'mention',
        priority: 'low'
    }),

    announcement: (fromUser, title) => ({
        title: 'Anuncio del Mural',
        description: `${fromUser?.username || fromUser?.email || 'Usuario'} ha publicado un anuncio para todos: ${title}`,
        type: 'bulletin_announcement',
        priority: 'medium'
    }),

    // Referral notifications
    referral_created: (userInfo, referredEmail) => ({
        title: 'Nueva Referencia',
        description: `Usuario ${userInfo?.username || userInfo?.email || 'Desconocido'} ha referido a ${referredEmail}`,
        type: 'referral',
        priority: 'medium'
    })
};

// Notification validation rules
export const NOTIFICATION_VALIDATION = {
    required: ['type', 'title', 'description', 'createdAt'],
    optional: ['userId', 'isAdminNotification', 'isRead', 'readAt', 'userInfo', 'additionalData'],
    
    // Type validation
    validTypes: Object.keys(NOTIFICATION_CONFIG.types),
    
    // Priority validation
    validPriorities: Object.keys(NOTIFICATION_CONFIG.priorities),
    
    // Content limits
    limits: {
        title: { min: 1, max: 200 },
        description: { min: 1, max: 1000 },
        maxUserInfoFields: 10,
        maxAdditionalDataFields: 20
    }
};

// Export default configuration
export default {
    config: NOTIFICATION_CONFIG,
    templates: NOTIFICATION_TEMPLATES,
    validation: NOTIFICATION_VALIDATION
};
