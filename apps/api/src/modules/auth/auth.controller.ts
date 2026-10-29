import { Request, Response } from 'express';
import { z } from 'zod';
import { registerUser, loginUser, getUserProfile } from './auth.service';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function handleRegister(req: Request, res: Response): Promise<void> {
  const parse = RegisterSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input fields.',
        details: parse.error.errors,
      },
    });
    return;
  }

  try {
    const data = await registerUser(parse.data.email, parse.data.password, parse.data.fullName);
    res.status(201).json({
      success: true,
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed.';
    res.status(400).json({
      success: false,
      error: { code: 'REGISTRATION_ERROR', message },
    });
  }
}

export async function handleLogin(req: Request, res: Response): Promise<void> {
  const parse = LoginSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email or password format.',
      },
    });
    return;
  }

  try {
    const data = await loginUser(parse.data.email, parse.data.password);
    res.json({
      success: true,
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed.';
    res.status(401).json({
      success: false,
      error: { code: 'AUTH_FAILED', message },
    });
  }
}

export async function handleGetMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not logged in.' } });
    return;
  }

  try {
    const user = await getUserProfile(req.user.id);
    res.json({
      success: true,
      data: user,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve profile.';
    res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message },
    });
  }
}
