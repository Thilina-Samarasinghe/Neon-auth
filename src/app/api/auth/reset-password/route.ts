import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, hashToken } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    const { email, token, newPassword } = await req.json();

    if (!email || !token || !newPassword) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Password validation: at least 6 characters, one capital letter, one symbol
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])(?=.{6,})/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Password must be at least 6 characters long and contain at least one uppercase letter and one symbol.' 
      }, { status: 400 });
    }

    const hashedToken = hashToken(token);

    const resetTokenRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: hashedToken,
        type: 'password_reset',
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetTokenRecord) {
      return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { passwordHash },
      }),
      prisma.verificationToken.delete({
        where: { id: resetTokenRecord.id },
      }),
      // optionally delete all sessions for the user to force them to login again
      prisma.session.deleteMany({
        where: { user: { email } },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'Password reset successfully' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
