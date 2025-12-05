import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/presets/[id] - Get a single preset
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const preset = await prisma.preset.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!preset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
    }

    return NextResponse.json({ preset });
  } catch (error) {
    console.error('Error fetching preset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/presets/[id] - Update a preset
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, settings } = body;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify preset belongs to user
    const existingPreset = await prisma.preset.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingPreset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
    }

    const preset = await prisma.preset.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(settings && { settings }),
      },
    });

    return NextResponse.json({ preset });
  } catch (error) {
    console.error('Error updating preset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/presets/[id] - Delete a preset
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify preset belongs to user
    const existingPreset = await prisma.preset.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingPreset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
    }

    await prisma.preset.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting preset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
