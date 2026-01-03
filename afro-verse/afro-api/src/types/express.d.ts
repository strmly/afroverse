import type { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
      id?: string; // Request ID for tracing
    }
  }
}

export {};

