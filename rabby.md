# Push Notification Setup Tracker (Rabby's List)

## 1. Firebase Project Setup (Manual Action Required)
- [ ] **USER ACTION:** Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
- [ ] **USER ACTION:** Add an Android App to the Firebase project. Package name is `com.quickdrop.app` (from your `capacitor.config.json`).

## 2. Frontend Configuration (Android) (Completed)
- [x] **USER ACTION:** Download the `google-services.json` file from Firebase.
- [x] **USER ACTION:** Place it inside the `frontend/android/app/` directory.
- [x] **USER ACTION:** Re-run `npx cap sync android` in your terminal.

## 3. Backend Configuration (Node.js) (Partially Complete!)
- [ ] **USER ACTION:** Go to Firebase Console -> Project Settings -> Service Accounts -> Generate new private key.
- [ ] **USER ACTION:** Save it as `backend/src/config/firebase-service-account.json`.
- [x] **AI ACTION:** Added `firebase-service-account.json` to `backend/.gitignore`.
- [x] **AI ACTION:** Initialized Firebase Admin in `backend/src/server.js`.
