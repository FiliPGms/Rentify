import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../lib/http-error.js';

export type AuthenticatedRequest = Request & {
  user: {
    id: string;
    email: string;
  };
};

type JwtPayload = {
  sub: string;
  email: string;
};

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Token de autenticacao ausente.');
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    (req as AuthenticatedRequest).user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    throw new HttpError(401, 'UNAUTHORIZED', 'Token de autenticacao invalido.');
  }
}
