import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/auth-utils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json({ success: false, message: 'Missing token or email' }, { status: 400 });
    }

    const hashedToken = hashToken(token);

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: hashedToken,
        type: 'email_verification',
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verificationToken) {
      return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Token is valid',
    }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
