# 🌐 WiFi Hub Admin Panel - Complete User Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Installation & Setup](#installation--setup)
4. [User Management](#user-management)
5. [Payment System](#payment-system)
6. [Network Status](#network-status)
7. [Support System](#support-system)
8. [Community Features](#community-features)
9. [Referral Program](#referral-program)
10. [Admin Dashboard](#admin-dashboard)
11. [Configuration](#configuration)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The WiFi Hub Admin Panel is a comprehensive management system for Starlink WiFi services. It provides user authentication, payment processing, network monitoring, support ticketing, and community features in a modern, glass-morphism interface.

### 🎨 Design Philosophy
- **Glass Morphism**: Modern, transparent UI with backdrop blur effects
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Mode**: Automatic theme switching with proper contrast
- **Interactive Elements**: Smooth animations and hover effects

---

## ✨ Features

### 🔐 Authentication System
- **Google Sign-In**: One-click authentication with Google accounts
- **Email/Password**: Traditional email-based registration and login
- **Referral Codes**: Users can register with referral codes for bonus credits
- **Role-Based Access**: Admin, Reporter, and Regular User roles

### 💳 Payment Management
- **Package System**: Admin-defined WiFi packages with time and pricing
- **SINPE Integration**: Costa Rican payment system integration
- **Payment Approval**: Admin approval workflow for payments
- **Receipt Generation**: Downloadable receipts in PNG/JPEG formats
- **QR Code Validation**: Transaction validation via QR codes

### 📊 Network Monitoring
- **Real-Time Status**: Live Starlink connection monitoring
- **Historical Data**: Network performance tracking over time
- **Data Visualization**: Chart.js graphs for uptime, speed, and latency
- **Data Optimization**: Automatic data compaction and retention policies

### 🎫 Support System
- **Ticket Management**: User support request system
- **Admin Dashboard**: Support ticket management interface
- **Category System**: Organized support request categories
- **Priority Levels**: Support ticket prioritization

### 🌟 Community Features
- **Digital Bulletin Board**: Local news and announcements
- **Post Moderation**: Admin-controlled content publishing
- **User Comments**: Community interaction system
- **Role-Based Posting**: Only admins and reporters can post

### 🎁 Referral Program
- **Unique Codes**: Automatic referral code generation
- **Credit Rewards**: Automatic credit distribution for successful referrals
- **Anti-Abuse System**: Cooldown periods and strike system
- **Activity Tracking**: Referral sharing and success monitoring

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project
- Git

### 1. Clone Repository
```bash
git clone [your-repository-url]
cd wifi-admin-panel
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Configuration
Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Firebase Emulators Setup
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Start emulators
firebase emulators:start
```

### 5. Start Development Server
```bash
npm run dev
```

---

## 👥 User Management

### User Registration
1. **Access**: Navigate to the login page
2. **Registration**: Click "Crear Cuenta" (Create Account)
3. **Referral Code**: Enter referral code (optional)
4. **Username**: Choose a unique username for community features
5. **Verification**: Email verification required

### User Roles
- **Admin**: Full system access, user management, payment approval
- **Reporter**: Can post to community bulletin board
- **Regular User**: Access to WiFi services and community features

### User Portal Features
- **Credit Management**: View and manage WiFi credits
- **Payment History**: Track all payment transactions
- **Network Usage**: Monitor WiFi connection usage
- **Community Access**: Participate in bulletin board discussions

---

## 💰 Payment System

### Package Configuration (Admin)
1. **Access**: Admin Dashboard → Settings → Time Package Settings
2. **Create Package**: Define name, price, and duration
3. **Activation**: Packages become immediately available for purchase

### User Purchase Process
1. **Select Package**: Choose from available WiFi packages
2. **Payment**: Complete SINPE payment
3. **Verification**: Admin reviews and approves payment
4. **Credit Addition**: Credits automatically added to user account

### Payment Features
- **Receipt Download**: PNG/JPEG format with transaction details
- **QR Code Generation**: For transaction validation
- **Status Tracking**: Payment approval workflow
- **Credit Calculation**: Automatic time-to-credit conversion

---

## 📡 Network Status

### Public Network Status Page
- **Real-Time Data**: Live Starlink connection information
- **Performance Metrics**: Uptime, speed, and latency tracking
- **Data Refresh**: Manual refresh button for current status
- **Historical Charts**: Performance trends over time

### Data Management (Admin)
- **Retention Policies**: Configure data storage duration
- **Compaction Settings**: Optimize database storage
- **Performance Monitoring**: Track system performance metrics
- **Cost Optimization**: Reduce Firebase billing costs

---

## 🎫 Support System

### User Support Request
1. **Access**: User Portal → Support tab
2. **Create Ticket**: Select category and priority
3. **Description**: Provide detailed issue description
4. **Submission**: Ticket sent to admin for review

### Admin Support Management
1. **Access**: Admin Dashboard → Support Management
2. **Ticket Review**: View and categorize support requests
3. **Response System**: Reply to user inquiries
4. **Status Updates**: Track ticket resolution progress

---

## 🌟 Community Features

### Digital Bulletin Board
- **Post Creation**: Admins and reporters can create posts
- **Content Moderation**: Admin-controlled publishing
- **User Interaction**: Comments and community engagement
- **Media Support**: Rich content with images and formatting

### Community Guidelines
- **Posting Rules**: Clear guidelines for community content
- **Moderation**: Admin oversight for quality control
- **User Engagement**: Encouraged participation and interaction

---

## 🎁 Referral Program

### Referral Code System
- **Automatic Generation**: Unique codes for each user
- **Credit Rewards**: Automatic credit distribution
- **Anti-Abuse Protection**: Cooldown periods and strike system
- **Activity Monitoring**: Track referral success rates

### Referral Management (Admin)
- **Code Monitoring**: Track referral code usage
- **Credit Distribution**: Monitor automatic reward system
- **Strike Management**: Handle user violations
- **System Analytics**: Referral program performance metrics

---

## 🛠️ Admin Dashboard

### Dashboard Overview
- **User Statistics**: Total users, active sessions, credit distribution
- **Payment Management**: Pending approvals, transaction history
- **System Health**: Network status, data performance
- **Quick Actions**: Common administrative tasks

### User Management
- **User Search**: Quick user lookup functionality
- **Credit Management**: Manual credit adjustments
- **Role Assignment**: User role management
- **Account Status**: User account monitoring

### Data Export
- **User Data**: Export user information for analysis
- **Payment Records**: Financial transaction exports
- **Network Data**: Performance metrics export
- **CSV Format**: Standard format for external tools

---

## ⚙️ Configuration

### Environment Variables
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Application Settings
VITE_APP_NAME=WiFi Hub
VITE_APP_VERSION=2.0.0
VITE_DEFAULT_LOCALE=es-CR
```

### Firebase Configuration
- **Authentication**: Google Sign-In, Email/Password
- **Firestore**: User data, payments, network status
- **Storage**: File uploads, receipts, images
- **Functions**: Backend processing, notifications

### Security Rules
- **User Access**: Role-based permissions
- **Data Protection**: Secure data access patterns
- **Admin Controls**: Restricted administrative functions

---

## 🔧 Troubleshooting

### Common Issues

#### Firebase Connection Errors
```bash
# Check emulator status
firebase emulators:start

# Verify configuration
firebase projects:list

# Check port conflicts
netstat -ano | findstr :8080
```

#### Development Server Issues
```bash
# Clear cache
npm run clean

# Reinstall dependencies
rm -rf node_modules && npm install

# Check port availability
lsof -i :5173
```

#### Build Issues
```bash
# Clear build cache
npm run build --force

# Check Node.js version
node --version

# Verify dependencies
npm audit
```

### Performance Optimization
- **Data Compaction**: Regular database cleanup
- **Image Optimization**: Compress uploaded images
- **Caching**: Implement browser caching strategies
- **Lazy Loading**: Optimize component loading

### Security Best Practices
- **Regular Updates**: Keep dependencies updated
- **Access Control**: Monitor admin access
- **Data Backup**: Regular data export and backup
- **Audit Logs**: Track system access and changes

---

## 📱 Mobile Optimization

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Touch Interface**: Touch-friendly controls
- **Performance**: Optimized for mobile networks
- **Cross-Platform**: Works on all mobile browsers

### Mobile Features
- **QR Code Scanning**: Camera-based transaction validation
- **Touch Gestures**: Swipe and tap interactions
- **Offline Support**: Basic functionality without internet
- **Push Notifications**: Real-time updates

---

## 🚀 Deployment

### Production Build
```bash
# Create production build
npm run build

# Test production build
npm run preview

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### Environment Setup
1. **Production Firebase**: Configure production Firebase project
2. **Domain Configuration**: Set up custom domain (e.g., wifi-hub.cr)
3. **SSL Certificate**: Automatic SSL/TLS configuration
4. **CDN**: Global content delivery network

### Monitoring & Analytics
- **Performance Monitoring**: Track application performance
- **Error Tracking**: Monitor and resolve issues
- **User Analytics**: Understand user behavior
- **System Health**: Monitor backend services

---

## 📞 Support & Contact

### Technical Support
- **Documentation**: This user guide and README files
- **Code Repository**: GitHub issues and discussions
- **Community**: User community forums

### Feature Requests
- **GitHub Issues**: Submit feature requests
- **User Feedback**: Community input and suggestions
- **Roadmap**: Planned feature development

---

## 🔄 Updates & Maintenance

### Regular Maintenance
- **Dependency Updates**: Monthly dependency reviews
- **Security Patches**: Regular security updates
- **Performance Reviews**: Quarterly performance analysis
- **User Feedback**: Continuous improvement based on feedback

### Version History
- **v2.0.0**: Major redesign with glass morphism
- **v1.5.0**: Referral program implementation
- **v1.0.0**: Initial release with basic features

---

## 📚 Additional Resources

### Documentation
- [README.md](./README.md) - Project overview and setup
- [API Documentation](./docs/API.md) - Backend API reference
- [Component Library](./docs/COMPONENTS.md) - React component documentation

### External Resources
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://reactjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Chart.js](https://www.chartjs.org/docs)

---

## 🎉 Conclusion

The WiFi Hub Admin Panel provides a comprehensive solution for managing Starlink WiFi services with a modern, user-friendly interface. This guide covers all aspects of setup, configuration, and usage to help you get the most out of the system.

For additional support or questions, please refer to the troubleshooting section or contact the development team.

---

**Last Updated**: December 2024  
**Version**: 2.0.0  
**Author**: WiFi Hub Development Team
