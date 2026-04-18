import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken, hashToken } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, isEmailVerified: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Instantly verify that their active session was NOT evicted by the 2-session maximum limit rule!
    const cookieStore = await cookies();
    const currentRefreshToken = cookieStore.get('refreshToken')?.value;
    if (!currentRefreshToken) {
      return NextResponse.json({ success: false, message: 'No session cookie' }, { status: 401 });
    }
    const hashedRefresh = hashToken(currentRefreshToken);
    const sessionExists = await prisma.session.findUnique({ where: { refreshToken: hashedRefresh } });
    if (!sessionExists) {
      return NextResponse.json({ success: false, message: 'Session forcefully terminated due to device limit' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: { user },
    }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
