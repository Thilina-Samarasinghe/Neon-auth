import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const currentRefreshToken = cookieStore.get('refreshToken')?.value;

    if (currentRefreshToken) {
      const hashedRefresh = hashToken(currentRefreshToken);
      await prisma.session.deleteMany({
        where: { refreshToken: hashedRefresh },
      });
      cookieStore.delete('refreshToken');
    }

    return NextResponse.json({ success: true, message: 'Logged out successfully' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
