'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { LoaderCircle } from 'lucide-react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin(user?.uid);
  const router = useRouter();

  const isLoading = isUserLoading || isAdminLoading;

  useEffect(() => {
    // Only perform redirection after the loading state is resolved.
    if (!isLoading) {
      if (!user || !isAdmin) {
        // If not loading and not an admin, redirect to chat.
        router.replace('/chat');
      }
    }
  }, [isLoading, user, isAdmin, router]);

  if (isLoading || !user || !isAdmin) {
    // While loading or if redirection is imminent, show a loader.
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If the user is an admin and everything has loaded, render the children.
  return <>{children}</>;
}
