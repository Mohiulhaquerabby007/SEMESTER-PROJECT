# Push Notification Integration - To-Do List

You have successfully installed the required packages (`@capacitor/push-notifications` and `firebase-admin`) and synced the Capacitor Android project. 

To complete the push notification setup, please follow these remaining steps:

## 1. Firebase Project Setup
- If you haven't already, create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
- Add an Android App to your Firebase project using your app's package name (found in `frontend/android/app/build.gradle`).

## 2. Frontend Configuration (Android)
- [ ] Download the `google-services.json` file from your Firebase Android App settings.
- [ ] Place the downloaded `google-services.json` file inside the `frontend/android/app/` directory.
- [ ] Re-run `npx cap sync android` just to be safe.

## 3. Backend Configuration (Node.js)
- [ ] Go to your Firebase Console -> Project Settings -> Service Accounts.
- [ ] Click **"Generate new private key"** and download the JSON file. 
- [ ] Move this JSON file to your backend folder (e.g., `backend/src/config/firebase-service-account.json`). **IMPORTANT: Do not commit this file to GitHub/version control.** Add it to your `.gitignore`.
- [ ] Initialize Firebase Admin in your `backend/src/server.js` (or `db.js`). Add this snippet near the top:

```javascript
const admin = require("firebase-admin");
const serviceAccount = require("./config/firebase-service-account.json"); // Update path as needed

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
```

Once these steps are completed, your React app will automatically register device tokens, and your Node.js backend will successfully dispatch real-time push notifications when users/riders send chat messages!
