'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { LoaderCircle } from 'lucide-react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin(user?.uid);
  const router = useRouter();

  const isLoading = isUserLoading || isAdminLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    // If not loading and not an admin, redirect to chat
    router.replace('/chat');
    return null; // Render nothing while redirecting
  }

  return <>{children}</>;
}
