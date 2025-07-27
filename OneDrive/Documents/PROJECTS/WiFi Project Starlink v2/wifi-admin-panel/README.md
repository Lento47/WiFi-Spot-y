# 📶 Wi-Fi Admin & User Portal

A full-stack web application for managing a **community Wi-Fi service**. Users can purchase time-based access using SINPE payments and generate Wi-Fi tokens, while an admin oversees payments, users, and community interactions. Built with **React** and **Firebase** (Auth, Firestore, Storage, and Cloud Functions).

---

## ✨ Key Features

### 🔐 Admin Panel
- **Secure Login** – Only `lejzer36@gmail.com` is allowed admin access (hard-coded).
- **Analytics Dashboard** – Monitor real-time stats: total revenue, users, payments, and tokens.
- **Payment Queue** – Approve or reject SINPE receipts with a single click.
- **User Management**:
  - Search users and view full details (credits, tokens, history).
  - Adjust credit balance (add/remove minutes).
  - Simulate token usage (mark as used).
- **Community Moderation**:
  - Delete any post.
  - Manage censored words and auto-penalize users with time deduction.
- **System Config**:
  - Create/delete **Wi-Fi time packages**.
  - Manage bulletin board channels with permission settings.
- **Dark Mode** – Admin panel supports modern dark mode UI.

### 👤 User Portal
- **Flexible Login** – Sign in via Email, Google, or Phone number.
- **Username Creation** – First-time users must choose a unique username.
- **Credit System**:
  - Buy credit via SINPE + receipt upload.
  - View credit in days/hours/minutes.
- **Token Generation**:
  - Create single-use tokens specifying time duration.
- **Bulletin Board**:
  - Post messages in channels (Slack-style).
  - Tag channels `#channel` and mention users `@username`.
  - Chat-style send on `Enter`.
- **Dark Mode** – Toggleable by the user.

### 🌐 Public Page
- **Network Status Page**:
  - Real-time **Starlink** status display (mocked data).
  - Uptime, speed, and latency visualized via chart.

---

## 📁 File Structure

```plaintext
wifi-admin-panel/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── admin/         # Admin UI components
│   │   ├── auth/          # Login and registration components
│   │   └── common/        # Reusable elements (e.g., Icon, Spinner)
│   ├── hooks/
│   │   └── useAuth.js     # Handles login and role management
│   ├── pages/
│   │   ├── AdminPage.jsx
│   │   ├── NetworkStatusPage.jsx
│   │   └── UserPage.jsx
│   ├── App.jsx
│   ├── firebase.js        # Firebase setup
│   └── index.jsx
├── functions/
│   ├── index.js           # Email + network simulation logic
│   └── package.json
├── .firebaserc
├── firebase.json
├── firestore.rules
├── storage.rules
└── package.json
```

---

## ⚙️ Setup & Installation

### 1. Clone Repository

```bash
git clone <your-repository-url>
cd wifi-admin-panel
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend (Functions) Dependencies

```bash
cd functions
npm install
cd ..
```

### 4. Configure Firebase

Edit `src/firebase.js` and add your Firebase config:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  // etc.
};
```

Enable Gmail for email notifications:

```bash
firebase functions:config:set gmail.email="your@gmail.com"
firebase functions:config:set gmail.password="your-app-password"
firebase functions:config:get > functions/.runtimeconfig.json
```

### 5. Run Locally

Open **two terminals**:

**Terminal 1** – Firebase Emulators:
```bash
firebase emulators:start
```

**Terminal 2** – React App:
```bash
npm run dev
```

Visit: [http://localhost:5173](http://localhost:5173)

---

## 🔧 Backend Services (Firebase)

### 🔑 Authentication
- Enabled: **Email**, **Google**, and **Phone**
- Admin email hard-coded in `useAuth.js`: `lejzer36@gmail.com`

### 🔥 Firestore Collections
| Collection       | Purpose                                         |
|------------------|--------------------------------------------------|
| `users`          | Username, credit balance, activity               |
| `payments`       | SINPE uploads & statuses                         |
| `tokens`         | Wi-Fi token data                                 |
| `timePackages`   | Custom duration/price plans                      |
| `topics`         | Bulletin board channel metadata                  |
| `posts`          | All user messages                                |
| `censoredWords`  | Forbidden words triggering penalties             |
| `config`         | Global settings (e.g., punishment minutes)       |

> ⚠️ Apply `firestore.rules` to protect your data.

### 🗂 Storage
- Used for storing **SINPE receipts**.
- Security rules restrict access per user folder (`storage.rules` required).

### 🔁 Cloud Functions
- **Email Alerts** – Sends confirmation when payment is approved.
- **Simulated Starlink Status** – Logs fake data every 5 mins.

> 🧾 Requires Blaze Plan for scheduled functions.

---

## 🌐 Captive Portal Integration (Router Setup)

This app works with routers like **pfSense**, **OpenWrt**, or **MikroTik**.

### Token Flow
1. User connects to Wi-Fi and is redirected to User Portal.
2. User purchases time and receives a token (e.g., `WIFI-ABCD-1234`).
3. Router login page requests Firebase Function to validate token.
4. Function checks:
   - Token exists.
   - Status is `'active'`.
5. If valid:
   - Responds with success.
   - Marks token as `'used'`.
   - Router grants access for `durationMinutes`.

---

## 🧪 TODO / Suggestions
- Add email notification customization
- Create admin notification panel for new payments
- Export reports (CSV / PDF)
- Mobile-first responsive enhancements

---

## 🛡 Security
- All Firebase rules must be applied before going live
- Admin role is hardcoded for full protection
- Token system is **single-use** and validated server-side

---

## 🧑‍💻 Tech Stack

- **Frontend**: React, Vite, Tailwind (optional)
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **Email**: NodeMailer (via Gmail credentials)

---

## 📬 Contact

Maintainer: [Lejzer Vanegas](mailto:lejzer36@gmail.com)  
Issues? Contributions? Pull requests are welcome!