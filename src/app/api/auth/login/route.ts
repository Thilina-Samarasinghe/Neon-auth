import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateAccessToken, generateRefreshToken, hashToken } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json({ success: false, message: 'Account is temporarily locked due to multiple failed login attempts. Try again later.' }, { status: 403 });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      const newAttempts = user.failedLoginAttempts + 1;
      let lockedUntil = null;

      if (newAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: newAttempts, lockedUntil },
      });

      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    // Reset failed attempts upon successful login
    if (user.failedLoginAttempts > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    // IP and User-Agent tracking
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Check sessions to limit to 2
    const currentSessions = await prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });

    if (currentSessions.length >= 2) {
      const sessionsToDelete = currentSessions.slice(0, currentSessions.length - 1);
      await prisma.session.deleteMany({
        where: { id: { in: sessionsToDelete.map((s: { id: string }) => s.id) } },
      });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const hashedRefresh = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: hashedRefresh,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    const cookieStore = await cookies();
    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });

    return NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        accessToken,
        user: { id: user.id, email: user.email },
      },
    }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
