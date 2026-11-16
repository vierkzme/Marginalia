import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { ENV } from '../../config/env';
import { prisma, isDatabaseConnected } from '../../config/db';
import { memoryStore, generateSeedData, UserEntity } from '../../config/store';

export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';
export const DEMO_USER_EMAIL = 'raka@engineering.dev';

function signToken(user: { id: string; email: string; fullName: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, fullName: user.fullName },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function registerUser(
  email: string,
  password: string,
  fullName: string,
  dailyReviewGoal: number = 20
) {
  const normalizedEmail = email.trim().toLowerCase();
  const dbConnected = await isDatabaseConnected();
  const passwordHash = await bcrypt.hash(password, 10);

  if (dbConnected) {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new Error('Email is already registered.');
    }

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName: fullName.trim(),
        dailyReviewGoal,
      },
    });

    const token = signToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        dailyReviewGoal: user.dailyReviewGoal,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        isDemo: false,
      },
      token,
    };
  } else {
    const store = memoryStore.getData();
    if (store.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error('Email is already registered.');
    }

    const newUser: UserEntity = {
      id: randomUUID(),
      email: normalizedEmail,
      passwordHash,
      fullName: fullName.trim(),
      dailyReviewGoal,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);
    memoryStore.save();

    const token = signToken(newUser);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        dailyReviewGoal: newUser.dailyReviewGoal,
        currentStreak: newUser.currentStreak,
        longestStreak: newUser.longestStreak,
        isDemo: false,
      },
      token,
    };
  }
}

export async function loginUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const dbConnected = await isDatabaseConnected();

  if (dbConnected) {
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isDemo = user.id === DEMO_USER_ID || user.email === DEMO_USER_EMAIL;
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match && !(isDemo && password === 'password123')) {
      throw new Error('Invalid email or password.');
    }

    const token = signToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        dailyReviewGoal: user.dailyReviewGoal,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        isDemo,
      },
      token,
    };
  } else {
    const store = memoryStore.getData();
    const user = store.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isDemo = user.id === DEMO_USER_ID || user.email === DEMO_USER_EMAIL;
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match && !(isDemo && password === 'password123')) {
      throw new Error('Invalid email or password.');
    }

    const token = signToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        dailyReviewGoal: user.dailyReviewGoal,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        isDemo,
      },
      token,
    };
  }
}

export async function loginDemoUser() {
  const dbConnected = await isDatabaseConnected();

  if (dbConnected) {
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ id: DEMO_USER_ID }, { email: DEMO_USER_EMAIL }],
      },
    });

    if (!user) {
      const seed = generateSeedData();
      const seedDemo = seed.users[0];
      const passwordHash = await bcrypt.hash('password123', 10);
      user = await prisma.user.create({
        data: {
          id: DEMO_USER_ID,
          email: seedDemo.email,
          passwordHash,
          fullName: seedDemo.fullName,
          dailyReviewGoal: seedDemo.dailyReviewGoal,
          currentStreak: seedDemo.currentStreak,
          longestStreak: seedDemo.longestStreak,
          lastActiveDate: seedDemo.lastActiveDate ? new Date(seedDemo.lastActiveDate) : null,
        },
      });
    }

    const token = signToken(user);
    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        dailyReviewGoal: user.dailyReviewGoal,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        isDemo: true,
      },
      token,
    };
  } else {
    const store = memoryStore.getData();
    let user = store.users.find((u) => u.id === DEMO_USER_ID || u.email === DEMO_USER_EMAIL);
    if (!user) {
      const seed = generateSeedData();
      user = seed.users[0];
      store.users.unshift(user);
      memoryStore.save();
    }

    const token = signToken(user);
    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        dailyReviewGoal: user.dailyReviewGoal,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        isDemo: true,
      },
      token,
    };
  }
}

export async function getUserProfile(userId: string) {
  const dbConnected = await isDatabaseConnected();

  if (dbConnected) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        dailyReviewGoal: true,
        currentStreak: true,
        longestStreak: true,
        lastActiveDate: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new Error('User not found.');
    }
    return {
      ...user,
      isDemo: user.id === DEMO_USER_ID || user.email === DEMO_USER_EMAIL,
    };
  } else {
    const store = memoryStore.getData();
    const user = store.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error('User not found.');
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      dailyReviewGoal: user.dailyReviewGoal,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActiveDate: user.lastActiveDate,
      createdAt: user.createdAt,
      isDemo: user.id === DEMO_USER_ID || user.email === DEMO_USER_EMAIL,
    };
  }
}

export interface UpdateProfileInput {
  fullName?: string;
  dailyReviewGoal?: number;
  newPassword?: string;
}

export async function updateUserProfile(userId: string, input: UpdateProfileInput) {
  const dbConnected = await isDatabaseConnected();
  const nextHash = input.newPassword ? await bcrypt.hash(input.newPassword, 10) : undefined;

  if (dbConnected) {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new Error('User not found.');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.fullName ? { fullName: input.fullName.trim() } : {}),
        ...(typeof input.dailyReviewGoal === 'number'
          ? { dailyReviewGoal: input.dailyReviewGoal }
          : {}),
        ...(nextHash ? { passwordHash: nextHash } : {}),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        dailyReviewGoal: true,
        currentStreak: true,
        longestStreak: true,
        lastActiveDate: true,
        createdAt: true,
      },
    });

    return {
      ...updated,
      isDemo: updated.id === DEMO_USER_ID || updated.email === DEMO_USER_EMAIL,
    };
  } else {
    const store = memoryStore.getData();
    const user = store.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error('User not found.');
    }

    if (input.fullName) {
      user.fullName = input.fullName.trim();
    }
    if (typeof input.dailyReviewGoal === 'number') {
      user.dailyReviewGoal = input.dailyReviewGoal;
    }
    if (nextHash) {
      user.passwordHash = nextHash;
    }

    memoryStore.save();

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      dailyReviewGoal: user.dailyReviewGoal,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActiveDate: user.lastActiveDate,
      createdAt: user.createdAt,
      isDemo: user.id === DEMO_USER_ID || user.email === DEMO_USER_EMAIL,
    };
  }
}
