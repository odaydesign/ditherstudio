'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Client-side redirect to the studio. (Server-side redirect() can't be used with
// `output: 'export'`.) The desktop shell loads /studio directly, so this only
// matters for the web build.
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/studio');
  }, [router]);
  return null;
}
