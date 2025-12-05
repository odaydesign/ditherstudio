import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/presets - List all user's presets
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ presets: [] });
    }

    const presets = await prisma.preset.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ presets });
  } catch (error) {
    console.error('Error fetching presets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/presets - Create a new preset
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, settings } = body;

    if (!name || !settings) {
      return NextResponse.json({ error: 'Name and settings are required' }, { status: 400 });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: '',
          plan: 'free',
        },
      });
    }

    const preset = await prisma.preset.create({
      data: {
        userId: user.id,
        name,
        settings,
      },
    });

    return NextResponse.json({ preset }, { status: 201 });
  } catch (error) {
    console.error('Error creating preset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
