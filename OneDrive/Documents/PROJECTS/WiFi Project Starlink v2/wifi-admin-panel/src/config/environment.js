// Environment Configuration
export const ENV_CONFIG = {
  // Development Environment
  development: {
    // App settings
    app: {
      debug: true,
      logLevel: 'debug',
      showDevTools: true,
      enableHotReload: true
    },

    // Firebase settings
    firebase: {
      useEmulators: true,
      enableLogging: true,
      enablePersistence: true,
      cacheSizeBytes: 100 * 1024 * 1024 // 100MB
    },

    // API settings
    api: {
      baseUrl: 'http://localhost:5001',
      timeout: 30000,
      retryAttempts: 3
    },

    // Feature flags
    features: {
      enableSampleData: true,
      enableDebugMode: true,
      enablePerformanceMonitoring: false,
      enableErrorReporting: false
    },

    // UI settings
    ui: {
      enableAnimations: true,
      enableTransitions: true,
      showLoadingStates: true,
      enableAutoRefresh: true
    }
  },

  // Production Environment
  production: {
    // App settings
    app: {
      debug: false,
      logLevel: 'warn',
      showDevTools: false,
      enableHotReload: false
    },

    // Firebase settings
    firebase: {
      useEmulators: false,
      enableLogging: false,
      enablePersistence: true,
      cacheSizeBytes: 50 * 1024 * 1024 // 50MB
    },

    // API settings
    api: {
      baseUrl: 'https://us-central1-wifi-users---token.cloudfunctions.net',
      timeout: 60000,
      retryAttempts: 2
    },

    // Feature flags
    features: {
      enableSampleData: false,
      enableDebugMode: false,
      enablePerformanceMonitoring: true,
      enableErrorReporting: true
    },

    // UI settings
    ui: {
      enableAnimations: false,
      enableTransitions: false,
      showLoadingStates: true,
      enableAutoRefresh: false
    }
  },

  // Test Environment
  test: {
    // App settings
    app: {
      debug: true,
      logLevel: 'debug',
      showDevTools: false,
      enableHotReload: false
    },

    // Firebase settings
    firebase: {
      useEmulators: true,
      enableLogging: false,
      enablePersistence: false,
      cacheSizeBytes: 10 * 1024 * 1024 // 10MB
    },

    // API settings
    api: {
      baseUrl: 'http://localhost:5001',
      timeout: 10000,
      retryAttempts: 1
    },

    // Feature flags
    features: {
      enableSampleData: true,
      enableDebugMode: true,
      enablePerformanceMonitoring: false,
      enableErrorReporting: false
    },

    // UI settings
    ui: {
      enableAnimations: false,
      enableTransitions: false,
      showLoadingStates: false,
      enableAutoRefresh: false
    }
  }
};

// Get current environment
export const getCurrentEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  return ENV_CONFIG[env] || ENV_CONFIG.development;
};

// Environment variables
export const ENV_VARS = {
  // Firebase
  FIREBASE_API_KEY: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyDDP-LppEuxU5bUtffghwakwOyx2a3Xuo8',
  FIREBASE_AUTH_DOMAIN: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'wifi-users---token.firebaseapp.com',
  FIREBASE_PROJECT_ID: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'wifi-users---token',
  FIREBASE_STORAGE_BUCKET: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'wifi-users---token.appspot.com',
  FIREBASE_MESSAGING_SENDER_ID: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '107841385394',
  FIREBASE_APP_ID: process.env.REACT_APP_FIREBASE_APP_ID || '1:107841385394:web:71bcdac1fa11bb79f62aab',
  FIREBASE_MEASUREMENT_ID: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || 'G-89F3JV5Y3N',

  // Emulator
  EMULATOR_HOST: process.env.REACT_APP_EMULATOR_HOST || '10.0.175.113',
  EMULATOR_PORT_FIRESTORE: process.env.REACT_APP_EMULATOR_PORT_FIRESTORE || '8080',
  EMULATOR_PORT_AUTH: process.env.REACT_APP_EMULATOR_PORT_AUTH || '9099',
  EMULATOR_PORT_STORAGE: process.env.REACT_APP_EMULATOR_PORT_STORAGE || '9199',
  EMULATOR_PORT_FUNCTIONS: process.env.REACT_APP_EMULATOR_PORT_FUNCTIONS || '5001',

  // App
  APP_NAME: process.env.REACT_APP_NAME || 'WiFi Admin Panel',
  APP_VERSION: process.env.REACT_APP_VERSION || '2.0.0',
  APP_ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || 'development',

  // API
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
  API_TIMEOUT: process.env.REACT_APP_API_TIMEOUT || '30000',

  // Features
  ENABLE_SAMPLE_DATA: process.env.REACT_APP_ENABLE_SAMPLE_DATA === 'true',
  ENABLE_DEBUG_MODE: process.env.REACT_APP_ENABLE_DEBUG_MODE === 'true',
  ENABLE_PERFORMANCE_MONITORING: process.env.REACT_APP_ENABLE_PERFORMANCE_MONITORING === 'true',
  ENABLE_ERROR_REPORTING: process.env.REACT_APP_ENABLE_ERROR_REPORTING === 'true',

  // Limits
  MAX_FILE_SIZE: process.env.REACT_APP_MAX_FILE_SIZE || '5242880', // 5MB
  MAX_IMAGE_SIZE: process.env.REACT_APP_MAX_IMAGE_SIZE || '2097152', // 2MB
  MAX_UPLOAD_RETRIES: process.env.REACT_APP_MAX_UPLOAD_RETRIES || '3',

  // Timeouts
  REQUEST_TIMEOUT: process.env.REACT_APP_REQUEST_TIMEOUT || '30000',
  UPLOAD_TIMEOUT: process.env.REACT_APP_UPLOAD_TIMEOUT || '60000',
  DOWNLOAD_TIMEOUT: process.env.REACT_APP_DOWNLOAD_TIMEOUT || '30000',

  // Pagination
  DEFAULT_PAGE_SIZE: process.env.REACT_APP_DEFAULT_PAGE_SIZE || '20',
  MAX_PAGE_SIZE: process.env.REACT_APP_MAX_PAGE_SIZE || '100',

  // Search
  SEARCH_DEBOUNCE_MS: process.env.REACT_APP_SEARCH_DEBOUNCE_MS || '300',
  MIN_SEARCH_LENGTH: process.env.REACT_APP_MIN_SEARCH_LENGTH || '2',

  // Refresh intervals
  NETWORK_STATUS_REFRESH_MS: process.env.REACT_APP_NETWORK_STATUS_REFRESH_MS || '300000', // 5 minutes
  USER_DATA_REFRESH_MS: process.env.REACT_APP_USER_DATA_REFRESH_MS || '60000', // 1 minute
  NOTIFICATIONS_REFRESH_MS: process.env.REACT_APP_NOTIFICATIONS_REFRESH_MS || '30000', // 30 seconds
};

// Feature flags
export const FEATURE_FLAGS = {
  // Core features
  ENABLE_NETWORK_STATUS: true,
  ENABLE_SUPPORT_SYSTEM: true,
  ENABLE_BULLETIN_BOARD: true,
  ENABLE_REFERRAL_PROGRAM: true,
  ENABLE_DATA_EXPORT: true,
  ENABLE_USER_MANAGEMENT: true,

  // Advanced features
  ENABLE_DATA_COMPACTION: true,
  ENABLE_AUTO_CLEANUP: true,
  ENABLE_EMAIL_NOTIFICATIONS: true,
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_ERROR_REPORTING: true,

  // Development features
  ENABLE_SAMPLE_DATA: ENV_VARS.ENABLE_SAMPLE_DATA,
  ENABLE_DEBUG_MODE: ENV_VARS.ENABLE_DEBUG_MODE,
  ENABLE_EMULATOR_UI: getCurrentEnvironment().firebase.useEmulators,

  // UI features
  ENABLE_DARK_MODE: true,
  ENABLE_ANIMATIONS: getCurrentEnvironment().ui.enableAnimations,
  ENABLE_TRANSITIONS: getCurrentEnvironment().ui.enableTransitions,
  ENABLE_AUTO_REFRESH: getCurrentEnvironment().ui.enableAutoRefresh
};

// Configuration validation
export const validateConfiguration = () => {
  const errors = [];

  // Check required Firebase config
  if (!ENV_VARS.FIREBASE_API_KEY || ENV_VARS.FIREBASE_API_KEY.includes('YOUR_')) {
    errors.push('Firebase API Key is not configured');
  }

  if (!ENV_VARS.FIREBASE_PROJECT_ID || ENV_VARS.FIREBASE_PROJECT_ID.includes('YOUR_')) {
    errors.push('Firebase Project ID is not configured');
  }

  // Check emulator configuration for development
  if (getCurrentEnvironment().firebase.useEmulators) {
    if (!ENV_VARS.EMULATOR_HOST) {
      errors.push('Emulator host is not configured');
    }
  }

  // Check feature flags
  if (FEATURE_FLAGS.ENABLE_EMAIL_NOTIFICATIONS && !ENV_VARS.FIREBASE_MESSAGING_SENDER_ID) {
    errors.push('Firebase Messaging Sender ID is required for email notifications');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Configuration helpers
export const isFeatureEnabled = (featureName) => {
  return FEATURE_FLAGS[featureName] === true;
};

export const getConfigValue = (key, defaultValue = null) => {
  return ENV_VARS[key] || defaultValue;
};

export const getEnvironmentConfig = () => {
  return getCurrentEnvironment();
};

// Export environment info
export const ENVIRONMENT_INFO = {
  current: getCurrentEnvironment(),
  variables: ENV_VARS,
  features: FEATURE_FLAGS,
  validation: validateConfiguration()
};
