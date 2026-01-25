import "express";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      username?: string;
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
