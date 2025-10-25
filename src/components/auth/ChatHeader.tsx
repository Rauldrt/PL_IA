'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

export default function ChatHeader() {
  const router = useRouter();
  const auth = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/');
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Logo className="h-8 w-8 text-primary" />
        <h1 className="font-headline text-xl font-bold text-foreground">Conecta IA</h1>
      </div>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Cerrar Sesión
      </Button>
    </header>
  );
}
