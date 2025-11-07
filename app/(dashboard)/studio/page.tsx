import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import DitherStudio from './components/DitherStudio';

export default async function StudioPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return <DitherStudio />;
}
