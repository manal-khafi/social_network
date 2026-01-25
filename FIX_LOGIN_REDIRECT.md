# FIX_LOGIN_REDIRECT.md

This file documents the process of fixing the issue where every route redirects to `/login`.

## Summary of Root Cause

The primary root cause of the issue was an infinite loop in the session rehydration logic. The `useAuthSession` hook was re-running on every render, and on failure, it was dispatching a `logout` action, which would trigger another re-render, creating an infinite loop. This was also causing a "Maximum update depth exceeded" error in React.

Additionally, the `/api/authentication/me` endpoint was not returning an access token, which complicated the session rehydration logic on the frontend.

## Final Fixes

Here are the final code changes that were applied to fix the issue.

### 1. Fix the infinite loop in `useAuthSession` hook

*   **File:** `front_end/src/hooks/useAuthSession.ts`
*   **Change:** Added an empty dependency array to `useEffect` to ensure it only runs once on mount.

```diff
--- a/front_end/src/hooks/useAuthSession.ts
+++ b/front_end/src/hooks/useAuthSession.ts
@@ -25,7 +25,7 @@
     };
 
     rehydrateSession();
-  }, [dispatch]);
+  }, []);
 
   return { isSessionLoading };
 };
```

### 2. Fix the 401 on `/me` by returning the token from the `Me` controller

*   **File:** `back_end/src/Controllers/Authentication/Me.ts`
*   **Change:** Modified the `Me` controller to include the access token in the response.

```diff
--- a/back_end/src/Controllers/Authentication/Me.ts
+++ b/back_end/src/Controllers/Authentication/Me.ts
@@ -10,6 +10,8 @@
       });
     }
 
+    const newAccessToken = res.getHeader('x-access-token') as string;
+
     return res.status(200).json({
       success: true,
       user: {
@@ -20,6 +22,7 @@
         role: req.user.role,
         permissions: req.user.permissions ?? [],
       },
+      token: newAccessToken,
     });
   } catch (error) {
     console.error("Me endpoint error:", error);
```

### 3. Fix the session rehydration logic in `useAuthSession` hook

*   **File:** `front_end/src/hooks/useAuthSession.ts`
*   **Change:** Modified the `rehydrateSession` function to use the token from the response.

```diff
--- a/front_end/src/hooks/useAuthSession.ts
+++ b/front_end/src/hooks/useAuthSession.ts
@@ -13,15 +13,9 @@
     const rehydrateSession = async () => {
       try {
         const response = await api.get("/authentication/me");
-        if (response.data.success) {
-             const token = store.getState().auth.token;
-             if (token) {
-                dispatch(setCredentials({ user: response.data.user, token }));
-             } else {
-                dispatch(logout());
-             }
+        if (response.data.success && response.data.token) {
+             dispatch(setCredentials({ user: response.data.user, token: response.data.token }));
         } else {
              dispatch(logout());
         }
       } catch (error) {
```

## Final Checklist to Validate

1.  **Login and check `/me` request:**
    *   Open the browser's developer tools and go to the "Network" tab.
    *   Log in to the application.
    *   Filter the network requests by "/me".
    *   You should see a single GET request to `/api/authentication/me` on page load.
    *   The request should have a status code of 200 OK.
    *   The response body should contain the user object and the access token.

2.  **Check for infinite loops:**
    *   Open the browser's console.
    *   There should be no "Maximum update depth exceeded" errors.
    *   The `/me` request should only be called once on page load.

3.  **Check route guards:**
    *   While logged in, refresh a protected route (e.g., `/home`). You should stay on that route.
    *   Log out of the application.
    *   Try to access a protected route (e.g., `/home`). You should be redirected to `/login`.

4.  **Check `httpOnly` cookie:**
    *   In the developer tools, go to the "Application" tab.
    *   Under "Cookies", select your application's domain.
    *   You should see a `refreshToken` cookie with the `HttpOnly` flag checked.
