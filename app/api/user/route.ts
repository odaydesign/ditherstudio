import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/user - Get current user profile
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        presets: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // If user doesn't exist in DB yet (webhook might not have fired), create them
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: '', // Will be updated by webhook
          plan: 'free',
        },
        include: {
          presets: true,
        },
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/user - Delete user account
export async function DELETE() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete user (cascades to presets)
    await prisma.user.delete({
      where: { clerkId: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
