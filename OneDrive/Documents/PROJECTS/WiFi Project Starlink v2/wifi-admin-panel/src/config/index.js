// Configuration Index
// This file exports all configuration modules for easy importing

// App Configuration
export * from './app.js';

// Firebase Configuration
export * from './firebase.js';

// Environment Configuration
export * from './environment.js';

// Notification Configuration
export * from './notifications.js';

// Re-export commonly used configurations
export { APP_CONFIG, TIME_PACKAGES, CURRENCY_CONFIG, STORAGE_PATHS, COLLECTIONS, DEFAULTS, VALIDATION_RULES, ERROR_MESSAGES, SUCCESS_MESSAGES } from './app.js';
export { FIREBASE_CONFIG, EMULATOR_CONFIG, FIREBASE_SETTINGS, CLOUD_FUNCTIONS_CONFIG, DATABASE_RULES, STORAGE_RULES, FIREBASE_ERROR_CODES, PERFORMANCE_CONFIG } from './firebase.js';
export { ENV_CONFIG, ENV_VARS, FEATURE_FLAGS, validateConfiguration, isFeatureEnabled, getConfigValue, getEnvironmentConfig, ENVIRONMENT_INFO } from './environment.js';

// Configuration utilities
export const getConfig = () => ({
  app: APP_CONFIG,
  firebase: FIREBASE_CONFIG,
  environment: getEnvironmentConfig(),
  features: FEATURE_FLAGS,
  validation: validateConfiguration()
});

// Configuration validation on import
const validation = validateConfiguration();
if (!validation.isValid) {
  console.warn('Configuration validation failed:', validation.errors);
}

// Default export for convenience
export default {
  app: APP_CONFIG,
  firebase: FIREBASE_CONFIG,
  environment: getEnvironmentConfig(),
  features: FEATURE_FLAGS,
  validation: validateConfiguration(),
  getConfig
};
