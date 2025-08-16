# WiFi Admin Panel - Starlink Network Status

A comprehensive admin panel for managing WiFi users and monitoring Starlink network performance in real-time.

## Features

### 🔐 Authentication & User Management
- **Admin Panel**: Manage users, payments, and system settings
- **User Panel**: Access bulletin board and account information
- **Role-based Access Control**: Secure admin and user permissions
- **User Search & Management**: Advanced search bar to find users quickly by username or email
- **Credit Management**: Manually add or remove credits for users with reason tracking
- **User History**: Complete payment and token history for each user

### 🎫 Support Ticketing System
- **User Support Portal**: Submit help requests with categories, priorities, and file attachments
- **Admin Ticket Management**: View, filter, and respond to support tickets efficiently
- **Real-time Updates**: Live ticket status updates and communication between users and admins
- **File Attachments**: Support for images, documents, and other file types (up to 5MB)

### 📊 Data Export System
- **CSV Export**: Export user, payment, token, support, and network data in CSV format
- **Flexible Filtering**: Date ranges, status filters, and custom date selection
- **Multiple Data Types**: Users, payments, tokens, support tickets, and network metrics
- **Progress Tracking**: Real-time export progress with visual feedback
- **Accounting Ready**: Formatted data perfect for financial analysis and record-keeping

### 📊 Network Status Page (Public)
- **Real-time Monitoring**: Live Starlink connection status
- **Performance Metrics**: Download/upload speeds, latency, and uptime
- **Historical Data**: 24-hour performance charts and trends
- **Public Access**: No authentication required for network status

### 🗜️ Network Data Management & Optimization
- **Intelligent Data Compaction**: Automatically aggregate detailed data to hourly and daily summaries
- **Cost Optimization**: Reduce Firebase billing by 80-90% through smart data retention
- **Automatic Cleanup**: Scheduled data cleanup to maintain optimal storage levels
- **Multi-tier Storage**: Detailed (7 days) → Hourly (30 days) → Daily (1+ years)
- **Scheduled Compaction**: Daily automatic data processing at 2 AM Costa Rica time

### 🔔 Enhanced Notification System
- **Real-time Admin Notifications**: Instant notifications for user submissions (payments, support tickets, bulletin posts, referrals)
- **Smart Filtering**: Categorized notifications by type with priority indicators
- **@all Tag Support**: Broadcast announcements to all users through bulletin board posts
- **Individual Mentions**: Tag specific users with @username for direct notifications
- **Notification Bell**: Header notification bell with unread count and quick preview
- **Auto-cleanup**: Automatic expiration of old notifications to maintain performance

## Configuration

The application uses a centralized configuration system located in `src/config/`. All settings, constants, and environment-specific values are managed through configuration files.

### Configuration Files
- **`src/config/app.js`**: Application settings, business logic, and constants
- **`src/config/firebase.js`**: Firebase configuration and emulator settings
- **`src/config/environment.js`**: Environment-specific settings and feature flags
- **`src/config/index.js`**: Main configuration index and utilities

### Environment Variables
Copy `env.example` to `.env` and configure your environment:

```bash
# Copy environment template
cp env.example .env

# Edit with your values
nano .env
```

### Key Configuration Areas
- **Firebase Settings**: API keys, project IDs, emulator configuration
- **Feature Flags**: Enable/disable specific features
- **Business Logic**: Time packages, currency, data retention policies
- **UI Settings**: File limits, pagination, search configuration
- **Security**: Validation rules, authentication requirements

For detailed configuration documentation, see `src/config/README.md`.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Firebase CLI
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wifi-admin-panel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your Firebase project details
   ```

4. **Start Firebase emulators**
   ```bash
   firebase emulators:start
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Main App: http://localhost:5173/
   - Network Status: http://localhost:5173/ (click "Estado de la Red")
   - Firebase Emulator UI: http://localhost:4000/

## Network Status Page Features

### 📈 Real-time Metrics
- **Connection Status**: Operational, Outage, or Degraded
- **Download Speed**: Current and historical download performance
- **Upload Speed**: Current and historical upload performance  
- **Latency**: Ping times and network responsiveness
- **Uptime**: 24-hour availability percentage

### 📊 Performance Charts
- **Interactive Charts**: Built with Chart.js for smooth data visualization
- **24-hour History**: Track performance trends over time
- **Multiple Metrics**: Overlay download, upload, and latency data
- **Responsive Design**: Works on desktop and mobile devices

### 🎯 Quality Indicators
- **Speed Quality**: Automatic classification (Excellent, Good, Acceptable, Low)
- **Latency Quality**: Performance rating based on ping times
- **Status Indicators**: Visual status indicators with color coding

## Data Structure

### User Management
The User Management system tracks credit adjustments and user history in the `users` collection:

```javascript
{
  // ... existing user fields ...
  creditsMinutes: number,           // Current credit balance in minutes
  lastCreditAdjustment: {           // Last credit adjustment made by admin
    amount: number,                  // Amount adjusted (positive or negative)
    reason: string,                  // Reason for the adjustment
    timestamp: Timestamp,            // When the adjustment was made
    previousAmount: number,          // Previous credit balance
    newAmount: number               // New credit balance after adjustment
  }
}
```

### Support Tickets
The Support Ticketing System uses a Firestore collection called `supportTickets` with the following structure:

```javascript
{
  userId: string,           // User ID who created the ticket
  userEmail: string,        // User's email address
  subject: string,          // Ticket subject/title
  category: string,         // 'technical' | 'billing' | 'connection' | 'account' | 'other'
  priority: string,         // 'low' | 'medium' | 'high' | 'urgent'
  description: string,      // Detailed problem description
  attachmentUrl: string,    // Optional file attachment URL
  status: string,           // 'open' | 'in_progress' | 'resolved' | 'closed'
  createdAt: Timestamp,     // When the ticket was created
  updatedAt: Timestamp,     // Last update timestamp
  adminReply: {             // Admin's response (optional)
    text: string,
    timestamp: Timestamp
  },
  lastReply: {              // User's last reply (optional)
    text: string,
    timestamp: Timestamp,
    isUser: boolean
  }
}
```

### Network Status
The Network Status Page reads from a Firestore collection called `networkStatus` with the following structure:

```javascript
{
  timestamp: Timestamp,
  status: 'OPERATIONAL' | 'OUTAGE' | 'DEGRADED',
  downloadSpeed: number, // Mbps
  uploadSpeed: number,   // Mbps
  latency: number,       // ms
  packetLoss: number,    // percentage
  jitter: number         // ms
}
```

### Notifications
The Enhanced Notification System uses a Firestore collection called `notifications` with the following structure:

```javascript
{
  // Core fields
  type: string,                    // 'payment_submission' | 'support_ticket' | 'bulletin_post' | 'referral' | 'mention' | 'bulletin_announcement'
  title: string,                   // Notification title
  description: string,             // Detailed description
  isAdminNotification: boolean,    // true for admin notifications, false for user notifications
  isRead: boolean,                 // Read status
  createdAt: Timestamp,            // Creation timestamp
  readAt: Timestamp,               // When marked as read (optional)
  
  // User notifications
  userId: string,                  // Target user ID (for user notifications)
  
  // Admin notifications
  userInfo: {                      // User information (for admin notifications)
    username: string,
    email: string,
    // ... other user fields
  },
  
  // Additional data based on type
  additionalData: {
    // Payment notifications
    paymentId: string,
    amount: number,
    packageName: string,
    
    // Support notifications
    ticketId: string,
    subject: string,
    category: string,
    priority: string,
    
    // Bulletin notifications
    postId: string,
    title: string,
    category: string,
    
    // Referral notifications
    referralId: string,
    referredEmail: string,
    relationship: string,
    
    // Mention notifications
    fromUserId: string,
    fromUsername: string,
    postId: string
  }
}
```

## Cloud Functions

The application includes several Firebase Cloud Functions for automated backend tasks:

### `scheduledDataCompaction`
- **Schedule**: Daily at 2 AM Costa Rica time
- **Purpose**: Automatically aggregates network status data from detailed to hourly/daily summaries
- **Benefits**: Reduces database size and Firebase billing costs by 80-90%

### `processReferralReward`
- **Trigger**: Firestore `onCreate` on `users` collection
- **Purpose**: Automatically processes referral rewards when new users register with a referral code
- **Actions**: Updates referral status and awards credits to the referrer

### Notification Triggers
- **`onPaymentSubmitted`**: Creates admin notifications for new payment submissions
- **`onSupportTicketCreated`**: Creates admin notifications for new support tickets
- **`onBulletinPostCreated`**: Creates admin notifications for new bulletin posts and handles @mentions and @all tags
- **`onReferralCreated`**: Creates admin notifications for new referrals
- **`onPaymentStatusChanged`**: Creates user notifications for payment status updates
- **`onSupportTicketStatusChanged`**: Creates user notifications for ticket updates and admin replies

## Development

### Sample Data
The app automatically generates sample network status data when running in development mode. This provides realistic data for testing and demonstration purposes.

### Customization
- Modify `src/pages/NetworkStatusPage.jsx` to change the UI and functionality
- Update `src/firebase.js` to modify data initialization
- Customize the chart appearance in the Chart.js configuration

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
firebase deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team or create an issue in the repository.
