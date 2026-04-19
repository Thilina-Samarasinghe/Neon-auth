import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { hashToken } from '@/lib/auth-utils';
import { sendEmail } from '@/lib/email';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: 'Invalid email format' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'Email already in use' }, { status: 409 });
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashedToken,
        type: 'email_verification',
        expiresAt,
      },
    });

    // Get origin for email link
    const headersList = await headers();
    const origin = headersList.get('origin') || 'http://localhost:3000';
    const verificationLink = `${origin}/register?token=${token}&email=${email}`;

    // Send email
    const emailSent = await sendEmail({
      to: email,
      subject: "Verify your email to complete registration",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #333; border-radius: 10px; background-color: #0a0a0a; color: #fff;">
          <h2 style="color: #00e5ff; text-align: center;">Welcome to Neon Auth!</h2>
          <p>You're almost there. To complete your registration, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background: linear-gradient(to right, #06b6d4, #2563eb); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #888; font-size: 14px;">${verificationLink}</p>
          <p style="font-size: 12px; color: #555; margin-top: 40px; border-top: 1px solid #333; padding-top: 20px;">
            This link will expire in 24 hours. If you did not request this, please ignore this email.
          </p>
        </div>
      `
    });

    if (!emailSent) {
      return NextResponse.json({ success: false, message: 'Failed to send verification email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
