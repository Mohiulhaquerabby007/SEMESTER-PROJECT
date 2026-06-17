# Implementation Plan — Production Deployment & Database Setup

Set up production environments, configure environment variables for both the React PWA frontend and Node.js backend, and deploy the application to cloud hosting.

## Decisions Made

| Item | Choice |
|------|--------|
| Firebase Hosting project | `dating-9fbf9` (Option B — authenticated CLI project) |
| Backend host | Render — `https://quickdrop-backend-u97o.onrender.com` |
| Firebase FCM / Admin project | `flexypay-82d33` (service account + web push config) |

## Completed Changes

### Backend Configuration

- **[DONE] `backend/src/server.js`** — Production frontend URLs in `ALLOWED_ORIGINS` (`dating-9fbf9.web.app`, `flexypay-82d33.web.app`, etc.)
- **[DONE] `backend/src/server.js`** — Firebase Admin supports `FIREBASE_SERVICE_ACCOUNT_JSON` env var for Render/cloud (local file fallback preserved)
- **[DONE] `backend/.env.example`** — Template for production env vars (no secrets committed)

### Frontend Configuration

- **[DONE] `frontend/.env.production`** — Full production config:
  - `VITE_API_URL=https://quickdrop-backend-u97o.onrender.com/api`
  - Google OAuth client ID
  - Firebase web config + VAPID key
- **[DONE] `frontend/.firebaserc`** — Bound to `dating-9fbf9`

### Deployment

- **[DONE] `npm run build`** — Vite production build succeeded (zero errors)
- **[DONE] `firebase deploy --only hosting --project dating-9fbf9`** — 12 files uploaded

## Live URLs

| Service | URL | Status |
|---------|-----|--------|
| Frontend (Firebase Hosting) | https://dating-9fbf9.web.app | Deployed |
| Backend API (Render) | https://quickdrop-backend-u97o.onrender.com/api | Running |
| Health check | https://quickdrop-backend-u97o.onrender.com/api/health | OK |

## Render Backend Environment Variables

Set these in the Render dashboard for `quickdrop-backend-u97o`:

```
PORT=5005
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/quickdrop?retryWrites=true&w=majority
JWT_SECRET=<256-bit-hex-secret>
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=<your-oauth-web-client-id>.apps.googleusercontent.com
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

> **Note:** Without `MONGO_URI`, Render falls back to in-memory MongoDB and data resets on each cold start. Without `FIREBASE_SERVICE_ACCOUNT_JSON`, push notifications are disabled.

## Google OAuth — Required Manual Step

Add these **Authorized JavaScript origins** in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

```
http://localhost:3000
https://dating-9fbf9.web.app
https://dating-9fbf9.firebaseapp.com
```

Save and wait 2–5 minutes before testing "Sign In with Google" on production.

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@quickdrop.com | admin1234 |
| User | mohiul@test.com | test1234 |
| Rider | rubel@rider.com | test1234 |

## Verification Checklist

- [x] Vite production build passes
- [x] Firebase CLI authenticated (`dating-9fbf9` project)
- [x] Frontend deployed to Firebase Hosting
- [x] Backend health endpoint returns `{ status: "ok" }`
- [x] Production bundle includes Render API URL
- [ ] Google OAuth origins whitelisted (manual — Google Cloud Console)
- [ ] Render env vars confirmed (MONGO_URI, JWT_SECRET, GOOGLE_CLIENT_ID, FIREBASE_SERVICE_ACCOUNT_JSON)

## Redeploy Commands

```powershell
# Frontend
cd frontend
npm run build
npx firebase-tools deploy --only hosting --project dating-9fbf9

# Backend (push to connected Git repo or trigger manual deploy on Render)
cd backend
npm start
```
