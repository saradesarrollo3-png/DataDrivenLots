
import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users, organizations } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string;
        organizationId: string;
      };
    }
  }
}

// Simple session store (in production, use Redis or similar)
const sessions = new Map<string, { userId: string; organizationId: string }>();

export function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createSession(userId: string, organizationId: string): string {
  const sessionId = generateSessionId();
  sessions.set(sessionId, { userId, organizationId });
  return sessionId;
}

export function getSession(sessionId: string) {
  return sessions.get(sessionId);
}

export function deleteSession(sessionId: string) {
  sessions.delete(sessionId);
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId) {
    return res.status(401).json({ message: "No autorizado" });
  }

  const session = getSession(sessionId);
  if (!session) {
    return res.status(401).json({ message: "Sesión inválida" });
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.userId));
  
  if (!user) {
    return res.status(401).json({ message: "Usuario no encontrado" });
  }

  req.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    organizationId: user.organizationId,
  };

  next();
}
