# FIX_REPORT.md

## Root Cause Analysis

The primary root cause of the Google and Facebook login issues, specifically the failure to remain authenticated after a reload and the `POST https://securetoken.googleapis.com/v1/token → 400` error, was a fundamental misunderstanding and misimplementation of Firebase Authentication's token management and session persistence.

1.  **Missing Frontend Firebase Auth Initialization:** The most critical issue was the absence of proper Firebase Auth initialization within the frontend application. The `getAuth()` and `initializeApp()` calls were located in `back_end/src/config/firebaseConfig.tsx`, which is an incorrect placement for client-side Firebase operations. This meant the Firebase SDK was not actively managing the authentication state, tokens, or persistence in the frontend.
2.  **Manual Token Handling in `localStorage`:** The application was manually storing and retrieving an "accessToken" in `localStorage` via `front_end/src/features/auth/authSlice.ts` and `front_end/src/hooks/useAuthSession.ts`. This manual approach bypassed Firebase's internal, secure, and automatic session management. The `accessToken` stored was likely either an expired Firebase ID token, a provider's access token, or some other invalid token, leading to `400 Bad Request` errors when attempts were made to use it for refreshing Firebase sessions or authenticating with the backend.
3.  **Incorrect Session Rehydration Logic:** The `useAuthSession.ts` hook attempted to "rehydrate" the session by making a backend call to `/authentication/me` and relying on the manually stored `accessToken`. This approach is contrary to Firebase's design, where `onAuthStateChanged` should be the single source of truth for authentication state.
4.  **Lack of Firebase ID Token in Axios Interceptor:** The Axios interceptor in `front_end/src/api/axios.ts` was retrieving a token from the Redux store (which in turn came from `localStorage` or backend response) rather than directly fetching a fresh Firebase ID token from `auth.currentUser?.getIdToken()`. This meant the backend was likely receiving invalid or expired tokens.
5.  **Persistence Not Explicitly Set:** Without proper initialization, the Firebase persistence mode was not guaranteed to be `LOCAL`, leading to session loss on refresh or browser close.

## Files Changed

1.  `front_end/src/config/firebase.ts` (New file created)
2.  `back_end/src/config/firebaseConfig.tsx`
3.  `front_end/src/features/auth/authSlice.ts`
4.  `front_end/src/hooks/useAuthSession.ts`
5.  `front_end/src/api/axios.ts`
6.  `front_end/src/main.tsx`

## What Was Changed

1.  **Created `front_end/src/config/firebase.ts`:**
    *   This new file now properly initializes Firebase for the frontend (`initializeApp`, `getAuth`).
    *   It explicitly sets Firebase Auth persistence to `browserLocalPersistence` (Step 3).
    *   It defines and exports `signInWithGoogle` and `signInWithFacebook` using `signInWithPopup`, ensuring these operations are handled by the Firebase SDK (Step 4).
    *   It exports the `auth` instance and a `firebaseSignOut` function.
2.  **Cleaned up `back_end/src/config/firebaseConfig.tsx`:**
    *   Removed all client-side Firebase Auth initialization and functions, as they were misplaced and causing confusion.
3.  **Modified `front_end/src/features/auth/authSlice.ts`:**
    *   Removed all direct interactions with `localStorage` for `accessToken` (Step 2).
    *   Adjusted `AuthState` to include `firebaseUser: FBUser | null` to store the actual Firebase `User` object.
    *   Introduced a new `setAuth` action to update the `firebaseUser`, `token` (Firebase ID token), and `isAuthenticated` states based on Firebase's `onAuthStateChanged` listener.
    *   Modified the `logout` action to clear `firebaseUser` in addition to other states.
4.  **Modified `front_end/src/hooks/useAuthSession.ts`:**
    *   Removed the custom `rehydrateSession` logic and associated API calls (Step 2). The hook now primarily provides an `isSessionLoading` state, which will be managed by the global `onAuthStateChanged` listener.
5.  **Modified `front_end/src/api/axios.ts`:**
    *   Updated the request interceptor to asynchronously fetch the current Firebase ID token using `auth.currentUser?.getIdToken()` and attach it to the `Authorization: Bearer` header for all outgoing requests (Step 5).
    *   Removed the logic that attempted to read `x-access-token` from response headers, as Firebase token management makes this redundant.
    *   Modified the 401 response handler to call `firebaseSignOut()` (from the new `front_end/src/config/firebase.ts`) in addition to dispatching the Redux `logout` action, ensuring Firebase's session is also cleared.
    *   Added a temporary `console.log` to show the length of the ID token being sent.
6.  **Modified `front_end/src/main.tsx`:**
    *   Implemented a global `onAuthStateChanged` listener using the `auth` instance from `front_end/src/config/firebase.ts` (Step 6).
    *   This listener dispatches `setAuthLoading()` initially.
    *   On user login, it retrieves the Firebase ID token (`user.getIdToken()`) and dispatches `setAuth` with the Firebase `User` object and the ID token.
    *   On user logout, it dispatches `setAuth` with `null` for both `firebaseUser` and `token`.
    *   Added temporary `console.log` statements for debugging purposes, showing login/logout status and Firebase ID token length.

## How to Test

1.  **Start the development servers for both frontend and backend.**
2.  **Open the frontend application in your browser.**
3.  **Open the browser's Developer Tools (F12) and navigate to the "Console" and "Network" tabs.**

**Google and Facebook Login Test:**

1.  **Login:** Attempt to sign in using Google.
    *   **Console:** You should see `DEBUG: Firebase user logged in. UID: ...` and `DEBUG: Firebase ID token length (main.tsx): ...`.
    *   **Network (filter by `identitytoolkit`):** Observe a `POST` request to `identitytoolkit.googleapis.com/v1/accounts:signInWithIdp`. This request exchanges the provider's credential for Firebase tokens. It should return a 200 OK.
    *   **Network (filter by `token` or your backend API endpoint):** If your app makes any authenticated backend calls immediately after login, observe the network request. It should contain an `Authorization: Bearer <token>` header, and you should see `DEBUG: Axios sending Firebase ID token of length: ...` in the console. The backend call should succeed (200 OK).
2.  **Reload Page:** Perform a hard refresh of the page (Ctrl+F5 or Cmd+Shift+R).
    *   **Console:** You should *still* see `DEBUG: Firebase user logged in. UID: ...` and `DEBUG: Firebase ID token length (main.tsx): ...`. This confirms Firebase persistence is working.
    *   **Network (filter by `securetoken`):** After some time (e.g., if the initial ID token has expired, typically 1 hour, or if `getIdToken(true)` is explicitly called), you should see `POST` requests to `securetoken.googleapis.com/v1/token`. These requests should return 200 OK, indicating successful ID token refreshing by Firebase.
    *   **Network (filter by your backend API endpoint):** Any authenticated backend calls should continue to succeed, using fresh ID tokens.
3.  **Logout:** Log out from the application.
    *   **Console:** You should see `DEBUG: Firebase user logged out.`
    *   **Network (filter by `authentication/logout`):** Observe the API call to your backend's logout endpoint.
    *   **Network (filter by `firebase` or `identitytoolkit`):** You might observe a `POST` request to `securetoken.googleapis.com/v1/accounts:signOut` or similar, initiated by `firebaseSignOut()`.

**Verification of Fixes:**

*   **Console Logs:** Check for the `DEBUG` messages to ensure Firebase `User` objects are being obtained, and ID tokens are present and have a reasonable length.
*   **Network Tab:**
    *   **`identitytoolkit.googleapis.com`:** Verify that `signInWithIdp` requests are successful after OAuth logins.
    *   **`securetoken.googleapis.com/v1/token`:** Crucially, observe these requests after page reloads. They should consistently return `200 OK`, indicating that Firebase is successfully refreshing ID tokens. The previous `400 Bad Request` errors should be gone.
    *   **Your Backend API Endpoints:** Ensure all authenticated calls to your backend succeed and carry a valid `Authorization: Bearer <Firebase_ID_Token>` header.
*   **Application State:** Confirm that the application correctly shows the user as authenticated after login and across reloads, and unauthenticated after logout.

The temporary `console.log` statements can be removed once the functionality is verified.