import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import prisma from '@/lib/db';

export async function POST(req: Request) {
  // Get the webhook secret from environment variables
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to your environment variables');
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error: Invalid signature', {
      status: 400,
    });
  }

  // Handle the webhook event
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses } = evt.data;
    const email = email_addresses[0]?.email_address || '';

    try {
      await prisma.user.create({
        data: {
          clerkId: id,
          email: email,
          plan: 'free',
        },
      });
      console.log(`User created: ${id}`);
    } catch (error) {
      console.error('Error creating user:', error);
      return new Response('Error creating user', { status: 500 });
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses } = evt.data;
    const email = email_addresses[0]?.email_address || '';

    try {
      await prisma.user.update({
        where: { clerkId: id },
        data: { email: email },
      });
      console.log(`User updated: ${id}`);
    } catch (error) {
      console.error('Error updating user:', error);
      // User might not exist yet, try creating
      try {
        await prisma.user.create({
          data: {
            clerkId: id,
            email: email,
            plan: 'free',
          },
        });
      } catch {
        // Ignore if user already exists
      }
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    if (id) {
      try {
        await prisma.user.delete({
          where: { clerkId: id },
        });
        console.log(`User deleted: ${id}`);
      } catch (error) {
        console.error('Error deleting user:', error);
        // User might not exist, that's ok
      }
    }
  }

  return new Response('Webhook processed', { status: 200 });
}
