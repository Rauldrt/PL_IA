'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // This check runs only on the client side
    const isLoggedIn = window.localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
      setIsAuthorized(true);
    } else {
      router.replace('/');
    }
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
