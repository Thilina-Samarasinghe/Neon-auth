import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { hashToken } from '@/lib/auth-utils';
import { sendEmail } from '@/lib/email';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: 'Valid email required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't leak if the user exists
      return NextResponse.json({ success: true, message: 'If an account with that email exists, we sent a password reset link.' }, { status: 200 });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashedToken,
        type: 'password_reset',
        expiresAt,
      },
    });

    // In a real app, you would send an email here with `token` (NOT `hashedToken`)
    // e.g. sendEmail(email, `https://yourapp.com/reset-password?token=${token}&email=${email}`)
    
    // get origin for email link
    const headersList = await headers();
    const origin = headersList.get('origin') || 'http://localhost:3000';
    const resetLink = `${origin}/reset-password?token=${token}&email=${email}`;
    console.log(`Password reset link: ${resetLink}`);
    
    const emailSent = await sendEmail({
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>This link is valid for 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `
    });

    if (!emailSent) {
      console.error("Failed to send reset email to", email);
    }

    return NextResponse.json({ success: true, message: 'If an account with that email exists, we sent a password reset link.' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
