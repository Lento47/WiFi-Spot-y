# Configuration System

This directory contains all configuration files for the WiFi Admin Panel application. The configuration system is designed to be centralized, maintainable, and environment-aware.

## Configuration Files

### 1. `app.js` - Application Configuration
Contains application-wide settings, constants, and business logic configuration.

**Key Sections:**
- **App Information**: Name, version, description
- **UI Settings**: File size limits, supported file types, pagination
- **Network Status**: Data retention policies, update intervals, sample data
- **Support System**: Categories, priorities, status labels
- **Bulletin Board**: Categories, priorities, content limits
- **Referral Program**: Credit rewards, code settings, processing rules
- **Data Export**: Export limits, formats, chunk sizes
- **Time Packages**: WiFi plan configurations
- **Currency**: Costa Rican Colón settings
- **Storage Paths**: File storage organization
- **Collections**: Firestore collection names
- **Defaults**: Default values for new records
- **Validation Rules**: Input validation patterns
- **Error Messages**: Localized error messages
- **Success Messages**: Localized success messages

### 2. `firebase.js` - Firebase Configuration
Contains Firebase-specific settings, emulator configuration, and service settings.

**Key Sections:**
- **Firebase Config**: Production and development configurations
- **Emulator Config**: Local development emulator settings
- **Environment Detection**: Development vs production detection
- **Firebase Settings**: Firestore, Storage, and Auth settings
- **Cloud Functions**: Function configuration and scheduling
- **Database Rules**: Security rules and validation
- **Storage Rules**: File upload limits and types
- **Error Codes**: Firebase error message mapping
- **Performance**: Monitoring and tracing configuration

### 3. `environment.js` - Environment Configuration
Contains environment-specific settings and feature flags.

**Key Sections:**
- **Environment Configs**: Development, production, and test settings
- **Environment Variables**: All configurable environment variables
- **Feature Flags**: Enable/disable specific features
- **Configuration Validation**: Validation logic and error checking
- **Helper Functions**: Utility functions for configuration access

### 4. `index.js` - Configuration Index
Main entry point that exports all configuration modules.

**Features:**
- Centralized exports for all configurations
- Configuration validation on import
- Utility functions for configuration access
- Default export for convenience

## Usage

### Basic Import
```javascript
import { APP_CONFIG, TIME_PACKAGES, CURRENCY_CONFIG } from '../config';
```

### Full Configuration Import
```javascript
import config from '../config';

// Access specific configurations
const maxFileSize = config.app.maxFileSize;
const firebaseConfig = config.firebase.production;
const isDebugEnabled = config.environment.app.debug;
```

### Feature Flag Check
```javascript
import { isFeatureEnabled } from '../config';

if (isFeatureEnabled('ENABLE_NETWORK_STATUS')) {
  // Show network status feature
}
```

### Environment-Specific Configuration
```javascript
import { getEnvironmentConfig } from '../config';

const envConfig = getEnvironmentConfig();
const useEmulators = envConfig.firebase.useEmulators;
```

## Environment Variables

The application supports configuration through environment variables. See `env.example` for a complete list of available variables.

### Key Environment Variables

#### Firebase Configuration
- `REACT_APP_FIREBASE_API_KEY`: Firebase API key
- `REACT_APP_FIREBASE_PROJECT_ID`: Firebase project ID
- `REACT_APP_FIREBASE_AUTH_DOMAIN`: Firebase auth domain

#### Emulator Configuration
- `REACT_APP_EMULATOR_HOST`: Local emulator host IP
- `REACT_APP_EMULATOR_PORT_FIRESTORE`: Firestore emulator port

#### Feature Flags
- `REACT_APP_ENABLE_SAMPLE_DATA`: Enable sample data generation
- `REACT_APP_ENABLE_DEBUG_MODE`: Enable debug mode
- `REACT_APP_ENABLE_PERFORMANCE_MONITORING`: Enable performance monitoring

#### Limits and Timeouts
- `REACT_APP_MAX_FILE_SIZE`: Maximum file upload size
- `REACT_APP_REQUEST_TIMEOUT`: API request timeout
- `REACT_APP_DEFAULT_PAGE_SIZE`: Default pagination size

## Configuration Validation

The configuration system includes built-in validation:

```javascript
import { validateConfiguration } from '../config';

const validation = validateConfiguration();
if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors);
}
```

## Adding New Configuration

### 1. Add to Appropriate Config File
```javascript
// In app.js
export const NEW_FEATURE_CONFIG = {
  enabled: true,
  maxItems: 100,
  timeout: 5000
};
```

### 2. Export from Index
```javascript
// In index.js
export { NEW_FEATURE_CONFIG } from './app.js';
```

### 3. Add Environment Variable Support (if needed)
```javascript
// In environment.js
export const ENV_VARS = {
  // ... existing vars
  NEW_FEATURE_ENABLED: process.env.REACT_APP_NEW_FEATURE_ENABLED === 'true',
};
```

## Best Practices

### 1. Centralization
- Keep all configuration in the `config` directory
- Avoid hardcoding values in components
- Use configuration constants instead of magic numbers

### 2. Environment Awareness
- Use environment-specific configurations
- Support both development and production settings
- Use feature flags for conditional functionality

### 3. Validation
- Validate configuration on application startup
- Provide clear error messages for missing configuration
- Use sensible defaults where possible

### 4. Security
- Never commit sensitive information to version control
- Use environment variables for secrets
- Validate configuration in production

### 5. Documentation
- Document all configuration options
- Provide examples and usage patterns
- Keep configuration files well-commented

## Configuration Categories

### Application Settings
- App name, version, and description
- Language and timezone settings
- UI preferences and limits

### Firebase Settings
- Project configuration
- Emulator settings
- Service configurations

### Feature Configuration
- Support system settings
- Bulletin board configuration
- Referral program rules

### Business Logic
- Time package definitions
- Currency settings
- Data retention policies

### Security and Validation
- Input validation rules
- File upload limits
- Authentication requirements

### Performance and Monitoring
- Cache settings
- Timeout configurations
- Monitoring options

## Troubleshooting

### Common Issues

1. **Configuration not loading**: Check that all required environment variables are set
2. **Emulator connection failed**: Verify emulator host and port configuration
3. **Feature not working**: Check if the feature flag is enabled
4. **Validation errors**: Review configuration validation output

### Debug Configuration

```javascript
import { ENVIRONMENT_INFO } from '../config';

console.log('Current configuration:', ENVIRONMENT_INFO);
```

### Environment Variable Debugging

```bash
# Check environment variables
echo $REACT_APP_FIREBASE_API_KEY

# Restart development server after changes
npm run dev
```

## Migration Guide

When updating configuration:

1. **Backup current configuration**
2. **Update configuration files**
3. **Test in development environment**
4. **Update environment variables**
5. **Deploy to production**
6. **Verify configuration**

## Support

For configuration-related issues:

1. Check the validation output
2. Review environment variables
3. Verify configuration file syntax
4. Check Firebase project settings
5. Review emulator configuration
