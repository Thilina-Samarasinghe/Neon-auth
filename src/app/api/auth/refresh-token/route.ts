import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAccessToken, generateRefreshToken, hashToken, verifyRefreshToken } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const currentRefreshToken = cookieStore.get('refreshToken')?.value;

    if (!currentRefreshToken) {
      return NextResponse.json({ success: false, message: 'Refresh token missing' }, { status: 401 });
    }

    const payload = verifyRefreshToken(currentRefreshToken);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Invalid or expired refresh token' }, { status: 401 });
    }

    const hashedRefresh = hashToken(currentRefreshToken);
    const session = await prisma.session.findUnique({
      where: { refreshToken: hashedRefresh },
    });

    if (!session) {
      return NextResponse.json({ success: false, message: 'Session not found' }, { status: 401 });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(payload.userId);
    const newRefreshToken = generateRefreshToken(payload.userId);
    const newHashedRefresh = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Update session
    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newHashedRefresh,
        expiresAt,
      },
    });

    cookieStore.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });

    return NextResponse.json({
      success: true,
      data: { accessToken: newAccessToken },
    }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
