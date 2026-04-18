import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth-utils';


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string' || !emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: 'Invalid email format or missing input' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'Email already in use' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      data: user,
    }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
