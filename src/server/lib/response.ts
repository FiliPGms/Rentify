import type { Response } from 'express';

export function sendOk<T>(res: Response, data: T, meta?: unknown): void {
  res.json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function sendCreated<T>(res: Response, data: T): void {
  res.status(201).json({ success: true, data });
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}
