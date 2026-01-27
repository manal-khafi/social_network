## Authentication Fixes Overview

This note explains the authentication issues we saw (logout on refresh) and the changes made to fix them.

## Symptoms

- After login, refreshing a protected route redirected back to login.
- Axios logs showed "No BACKEND JWT found in store" after reload.
- Firebase auth state sometimes overwrote backend auth state.

## Root Causes

- Auth state only lived in Redux memory; it was lost on refresh.
- No reliable session rehydration on app start.
- Backend refresh flow existed but the client did not consume the new access token.
- Social login sent the wrong payload and returned a JWT shape the middleware did not expect.

## Fixes Applied

### 1) Persist auth in localStorage

- Added `auth_session` persistence for `{ token, user }`.
- `authSlice` loads persisted auth on startup.
- `setAuth` updates localStorage, `logout` clears it.

Files:
- `front_end/src/features/auth/authSlice.ts`

### 2) Rehydrate session on app start

- `useAuthSession` now calls `/authentication/me` once on mount.
- It restores the session from the backend when possible.
- If `/me` fails, it keeps the persisted session instead of logging out immediately.

Files:
- `front_end/src/hooks/useAuthSession.ts`

### 3) Keep Firebase state separate from backend JWT

- Firebase `onAuthStateChanged` now only updates `firebaseUser`.
- It no longer replaces backend JWT in Redux.

Files:
- `front_end/src/main.tsx`
- `front_end/src/features/auth/authSlice.ts`

### 4) Make Axios resilient on refresh

- If Redux has no token, Axios falls back to the persisted `auth_session`.
- If backend sends `x-access-token`, Axios updates the store.
- Do not auto-logout on `/authentication/me` 401 (let the rehydrate flow decide).

Files:
- `front_end/src/api/axios.ts`

### 5) Fix social login payload + token shape

- Frontend now sends `{ idToken }` instead of `{ token }`.
- Backend accepts `idToken` and issues access/refresh tokens.
- Access token payload now includes `id`, `role`, `permissions`, `onboarding_done`.

Files:
- `front_end/src/utils/api.ts`
- `back_end/src/Controllers/Authentication/social.ts`

### 6) Return token from `/authentication/me`

- Backend returns a token in `/me` response, using:
  - `x-access-token` when refreshed
  - or the bearer token from the request

Files:
- `back_end/src/Controllers/Authentication/Me.ts`

## Current Auth Flow (Short)

1. User logs in -> backend returns JWT + refresh cookie.
2. JWT stored in Redux and persisted in `localStorage`.
3. On refresh:
   - `useAuthSession` calls `/authentication/me`.
   - If ok, store updates with fresh token and user.
   - If not ok (temporary error), persisted token remains.
4. Axios always attaches a token (Redux first, localStorage fallback).

## Debug Tips

- Check `localStorage.auth_session` after login.
- In Network tab, `/authentication/me` should return 200 and a `token`.
- Verify `refreshToken` cookie is present and httpOnly.

## Files Changed Summary

Frontend:
- `front_end/src/features/auth/authSlice.ts`
- `front_end/src/hooks/useAuthSession.ts`
- `front_end/src/main.tsx`
- `front_end/src/api/axios.ts`
- `front_end/src/Components/Authentication/auth/LoginScreen.tsx`
- `front_end/src/Components/Authentication/auth/RegisterScreen.tsx`
- `front_end/src/utils/api.ts`

Backend:
- `back_end/src/Controllers/Authentication/Me.ts`
- `back_end/src/Controllers/Authentication/social.ts`
