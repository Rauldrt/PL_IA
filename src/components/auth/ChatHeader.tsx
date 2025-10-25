'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, ShieldCheck, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useIsAdmin } from '@/hooks/use-is-admin';

export default function AuthChatHeader() {
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin(user?.uid);


  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.replace('/');
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-6">
      <Link href="/chat" className="flex items-center gap-2 sm:gap-3">
        <Logo width={40} height={40} />
        <h1 className="font-headline text-lg sm:text-xl font-bold text-foreground">Conecta IA</h1>
      </Link>
      <div className="flex items-center gap-2 sm:gap-4">
        <Link href="/fiscales" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            <Briefcase size={16} /> <span className="hidden sm:inline">Fiscales</span>
        </Link>
        {!isAdminLoading && isAdmin && (
            <Link href="/admin" className="hidden sm:flex text-sm font-medium text-primary hover:underline items-center gap-1">
                <ShieldCheck size={16} /> Admin
            </Link>
        )}
        {user?.email && (
            <span className="hidden md:inline text-sm text-muted-foreground">{user.email}</span>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout} className="p-2 sm:p-4">
          <LogOut className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </Button>
      </div>
    </header>
  );
}
