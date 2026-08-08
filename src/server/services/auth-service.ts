import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../lib/http-error.js';
import { prisma } from '../lib/prisma.js';

// ── Token helpers ────────────────────────────────────────────────────────────

function signAccessToken(user: { id: string; email: string }): string {
  const options: SignOptions = {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn']
  };
  return jwt.sign({ email: user.email }, env.JWT_SECRET, { ...options });
}

function signRefreshToken(user: { id: string; email: string }): string {
  const options: SignOptions = {
    subject: user.id,
    expiresIn: env.REFRESH_EXPIRES_IN as SignOptions['expiresIn']
  };
  return jwt.sign({ email: user.email }, env.REFRESH_SECRET, { ...options });
}

type JwtPayload = { sub: string; email: string };

export function verifyRefreshToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.REFRESH_SECRET) as JwtPayload;
  } catch {
    throw new HttpError(401, 'INVALID_REFRESH', 'Refresh token inválido ou expirado.');
  }
}

// ── Auth operations ──────────────────────────────────────────────────────────

export async function register(input: { nome: string; email: string; senha: string }) {
  const senhaHash = await bcrypt.hash(input.senha, 12);
  const user = await prisma.usuario.create({
    data: {
      nome: input.nome,
      email: input.email.toLowerCase(),
      senhaHash
    },
    select: { id: true, nome: true, email: true }
  });

  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
    user
  };
}

export async function login(input: { email: string; senha: string }) {
  const user = await prisma.usuario.findUnique({
    where: { email: input.email.toLowerCase() }
  });

  if (!user) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Credenciais invalidas.');
  }

  const valid = await bcrypt.compare(input.senha, user.senhaHash);
  if (!valid) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Credenciais invalidas.');
  }

  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
    user: { id: user.id, nome: user.nome, email: user.email }
  };
}

export function refreshAccessToken(refreshTokenStr: string) {
  const payload = verifyRefreshToken(refreshTokenStr);

  const user = { id: payload.sub, email: payload.email };
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user) // rotation: gera novo refresh a cada uso
  };
}
