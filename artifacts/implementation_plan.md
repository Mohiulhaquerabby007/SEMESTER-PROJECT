# Implementation Plan — Production Deployment & Database Setup

Set up production environments, configure environment variables for both the React PWA frontend and Node.js backend, and deploy the application to cloud hosting.

## User Review Required

> [!IMPORTANT]
> - **Firebase Project Selection:** The current Firebase login only lists `dating-9fbf9` as an active project, but the project files (`.firebaserc`) reference `flexypay-82d33` and `flexypay-82d3382d33`. We need to align on the correct target project or create a new one.
> - **Backend Cloud URL:** Render or VPS hosting URLs need to be mapped in CORS config on the backend, and in `VITE_API_URL` on the frontend before compilation.

## Open Questions

> [!WARNING]
> 1. Which Firebase project should we target for frontend hosting?
>    - **Option A:** Deploy to `flexypay-82d33` (requires logging in to the correct Firebase owner account).
>    - **Option B:** Deploy to `dating-9fbf9` (the currently authenticated project in your CLI).
>    - **Option C:** Create a new project (e.g. `quickdrop-prod-xxx`).
> 2. Where is your backend going to be hosted? Do you want to deploy the Node/Express backend to Render, or do you have an active VPS/server?

## Proposed Changes

### Backend Configuration

#### [MODIFY] [server.js](file:///d:/Software%20Development%20Project/SEMESTER-PROJECT/backend/src/server.js)
- Append the production frontend URL (once finalized) to the `ALLOWED_ORIGINS` array to ensure CORS request validation doesn't block the frontend client.

### Frontend Configuration

#### [MODIFY] [env.production](file:///d:/Software%20Development%20Project/SEMESTER-PROJECT/frontend/.env.production)
- Update `VITE_API_URL` to point to the production backend URL (e.g. `https://quickdrop-backend-u97o.onrender.com/api`) instead of the local/IP address fallback.

#### [MODIFY] [.firebaserc](file:///d:/Software%20Development%20Project/SEMESTER-PROJECT/frontend/.firebaserc)
- If a different Firebase project is selected, update the project binding to point to the selected project ID.

## Verification Plan

### Automated Tests
- Run Vite production builder to ensure production configuration bundles correctly:
  ```powershell
  npm run build
  ```

### Manual Verification
1. Validate active Firebase session using:
   ```powershell
   npx firebase-tools projects:list
   ```
2. Trigger a trial deploy dry-run or full deploy of the React app:
   ```powershell
   npx firebase-tools deploy --only hosting
   ```
3. Test production URL in a browser subagent: verify login flow, dashboard loading, and database connectivity.
