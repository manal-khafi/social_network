import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 10, // Limit each IP to 10 requests per `window` (here, per 15 minutes)
	message: {
        success: false,
        message: "Too many login attempts, please try again after 15 minutes"
    },
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export const registerLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	limit: 5, // Limit each IP to 5 registration requests per hour
	message: {
        success: false,
        message: "Too many accounts created from this IP, please try again after an hour"
    },
	standardHeaders: true,
	legacyHeaders: false,
});

export const twoFactorLimiter = rateLimit({
	windowMs: 5 * 60 * 1000, // 5 minutes
	limit: 5, // Limit each IP to 5 requests per 5 minutes
	message: {
        success: false,
        message: "Too many attempts, please try again after 5 minutes"
    },
	standardHeaders: true,
	legacyHeaders: false,
});

export const forgotPasswordLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	limit: 5, // Limit each IP to 5 reset-link requests per hour
	message: {
        success: false,
        message: "Too many password reset requests, please try again after an hour"
    },
	standardHeaders: true,
	legacyHeaders: false,
});

export const resetPasswordLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	limit: 5, // Limit each IP to 5 password resets per hour
	message: {
        success: false,
        message: "Too many password reset attempts, please try again after an hour"
    },
	standardHeaders: true,
	legacyHeaders: false,
});

export const socialLoginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 10, // Limit each IP to 10 social logins per 15 minutes
	message: {
        success: false,
        message: "Too many login attempts, please try again after 15 minutes"
    },
	standardHeaders: true,
	legacyHeaders: false,
});

// Server-side Google / Facebook sign-in: each attempt is two full-page
// requests (start + callback), and the browser is mid-redirect, so over the
// limit it goes back to the app with an error instead of a bare JSON page.
export const oauthLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 30,
	standardHeaders: true,
	legacyHeaders: false,
	handler: (_req, res) => {
		const frontend = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
		res.redirect(`${frontend}/#oauth_error=too_many_attempts`);
	},
});
