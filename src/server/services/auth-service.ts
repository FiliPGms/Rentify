import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../lib/http-error.js';
import { prisma } from '../lib/prisma.js';

function signToken(user: { id: string; email: string }): string {
  const options: SignOptions = {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn']
  };

  return jwt.sign({ email: user.email }, env.JWT_SECRET, {
    ...options
  });
}

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

  return { token: signToken(user), user };
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
    token: signToken(user),
    user: { id: user.id, nome: user.nome, email: user.email }
  };
}
