import "express";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      username?: string;
      avatar_url?: string | null;
      role?: string;
      permissions: string[];
      onboarding_done: boolean;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
