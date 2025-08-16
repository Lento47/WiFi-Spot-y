// Firebase Configuration
export const FIREBASE_CONFIG = {
  // Production Firebase Config
  production: {
    apiKey: "AIzaSyDDP-LppEuxU5bUtffghwakwOyx2a3Xuo8",
    authDomain: "wifi-users---token.firebaseapp.com",
    projectId: "wifi-users---token",
    storageBucket: "wifi-users---token.appspot.com",
    messagingSenderId: "107841385394",
    appId: "1:107841385394:web:71bcdac1fa11bb79f62aab",
    measurementId: "G-89F3JV5Y3N"
  },
  
  // Development Firebase Config (if different)
  development: {
    apiKey: "AIzaSyDDP-LppEuxU5bUtffghwakwOyx2a3Xuo8",
    authDomain: "wifi-users---token.firebaseapp.com",
    projectId: "wifi-users---token",
    storageBucket: "wifi-users---token.appspot.com",
    messagingSenderId: "107841385394",
    appId: "1:107841385394:web:71bcdac1fa11bb79f62aab",
    measurementId: "G-89F3JV5Y3N"
  }
};

// Emulator Configuration
export const EMULATOR_CONFIG = {
  // Local IP address for emulator connection
  host: "10.0.175.113",
  
  // Emulator ports
  ports: {
    auth: 9099,
    firestore: 8080,
    storage: 9199,
    functions: 5001,
    hosting: 5000,
    ui: 4000
  },
  
  // Emulator URLs
  urls: {
    auth: `http://10.0.175.113:9099`,
    firestore: `http://10.0.175.113:8080`,
    storage: `http://10.0.175.113:9199`,
    functions: `http://10.0.175.113:5001`,
    hosting: `http://10.0.175.113:5000`,
    ui: `http://10.0.175.113:4000`
  }
};

// Environment Detection
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

// Get current Firebase config based on environment
export const getCurrentFirebaseConfig = () => {
  if (isDevelopment) {
    return FIREBASE_CONFIG.development;
  }
  return FIREBASE_CONFIG.production;
};

// Get emulator host based on environment
export const getEmulatorHost = () => {
  if (isDevelopment) {
    return EMULATOR_CONFIG.host;
  }
  return null; // No emulator in production
};

// Emulator connection settings
export const shouldUseEmulators = isDevelopment;
export const shouldConnectToEmulators = isDevelopment;

// Firebase service settings
export const FIREBASE_SETTINGS = {
  // Firestore settings
  firestore: {
    cacheSizeBytes: 50 * 1024 * 1024, // 50MB cache
    experimentalForceLongPolling: false,
    useFetchStreams: false
  },
  
  // Storage settings
  storage: {
    maxUploadRetryTime: 60000, // 1 minute
    maxOperationRetryTime: 120000 // 2 minutes
  },
  
  // Auth settings
  auth: {
    persistence: 'local', // 'local', 'session', 'none'
    signInOptions: ['email', 'phone', 'anonymous']
  }
};

// Cloud Functions configuration
export const CLOUD_FUNCTIONS_CONFIG = {
  // Function regions
  region: 'us-central1',
  
  // Scheduled functions
  scheduled: {
    networkStatusLog: 'every 5 minutes',
    dataCompaction: '0 2 * * *', // Daily at 2 AM Costa Rica time
    cleanup: '0 3 * * *' // Daily at 3 AM Costa Rica time
  },
  
  // Function timeouts
  timeouts: {
    default: 60, // seconds
    dataCompaction: 540, // 9 minutes
    emailSending: 30 // 30 seconds
  },
  
  // Memory allocation
  memory: {
    default: '256MiB',
    dataCompaction: '512MiB',
    emailSending: '128MiB'
  }
};

// Database rules and security
export const DATABASE_RULES = {
  // Collection access rules
  collections: {
    users: {
      read: 'auth.uid == resource.data.userId || auth.token.admin == true',
      write: 'auth.uid == resource.data.userId || auth.token.admin == true'
    },
    payments: {
      read: 'auth.uid == resource.data.userId || auth.token.admin == true',
      write: 'auth.uid == resource.data.userId || auth.token.admin == true'
    },
    networkStatus: {
      read: true, // Public read access
      write: 'auth.token.admin == true' // Admin write only
    },
    supportTickets: {
      read: 'auth.uid == resource.data.userId || auth.token.admin == true',
      write: 'auth.uid == resource.data.userId || auth.token.admin == true'
    }
  },
  
  // Field validation rules
  validation: {
    user: {
      required: ['email', 'createdAt'],
      optional: ['username', 'phone', 'creditsMinutes', 'referralCode']
    },
    payment: {
      required: ['userId', 'status', 'createdAt'],
      optional: ['amount', 'packageName', 'receiptImageUrl', 'adminNotes']
    }
  }
};

// Storage rules
export const STORAGE_RULES = {
  // File size limits
  maxFileSizes: {
    receipts: 10 * 1024 * 1024, // 10MB
    supportAttachments: 5 * 1024 * 1024, // 5MB
    bulletinImages: 2 * 1024 * 1024, // 2MB
    userAvatars: 1 * 1024 * 1024 // 1MB
  },
  
  // Allowed file types
  allowedTypes: {
    receipts: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    supportAttachments: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
    bulletinImages: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    userAvatars: ['image/jpeg', 'image/png', 'image/gif']
  },
  
  // Path patterns
  pathPatterns: {
    receipts: 'receipts/{userId}/{timestamp}-{filename}',
    supportAttachments: 'support-attachments/{userId}/{timestamp}-{filename}',
    bulletinImages: 'bulletin-images/{timestamp}_{filename}',
    userAvatars: 'user-avatars/{userId}/{timestamp}_{filename}'
  }
};

// Error codes and messages
export const FIREBASE_ERROR_CODES = {
  // Auth errors
  'auth/user-not-found': 'Usuario no encontrado',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/email-already-in-use': 'Este correo ya está en uso',
  'auth/weak-password': 'La contraseña es demasiado débil',
  'auth/invalid-email': 'Correo electrónico inválido',
  
  // Firestore errors
  'permission-denied': 'Permiso denegado',
  'unavailable': 'Servicio no disponible',
  'deadline-exceeded': 'Tiempo de espera agotado',
  
  // Storage errors
  'storage/unauthorized': 'No autorizado para acceder a este archivo',
  'storage/canceled': 'Operación cancelada',
  'storage/unknown': 'Error desconocido en el almacenamiento'
};

// Performance monitoring
export const PERFORMANCE_CONFIG = {
  // Trace names
  traces: {
    userLogin: 'user_login',
    paymentSubmission: 'payment_submission',
    dataExport: 'data_export',
    networkStatusFetch: 'network_status_fetch'
  },
  
  // Custom metrics
  metrics: {
    activeUsers: 'active_users',
    paymentSuccessRate: 'payment_success_rate',
    supportTicketResponseTime: 'support_ticket_response_time'
  }
};
