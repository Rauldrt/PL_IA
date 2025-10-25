'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export default function AuthChatHeader() {
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user && firestore) {
        const adminRoleDoc = doc(firestore, `roles_admin/${user.uid}`);
        try {
            const docSnap = await getDoc(adminRoleDoc);
            setIsAdmin(docSnap.exists());
        } catch (error) {
            console.error("Error checking admin status:", error);
            setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [user, firestore]);

  const handleLogout = async () => {
    if(auth) {
      await signOut(auth);
      router.replace('/');
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-6">
      <Link href="/chat" className="flex items-center gap-3">
        <Logo className="h-8 w-8 text-primary" />
        <h1 className="font-headline text-xl font-bold text-foreground">Conecta IA</h1>
      </Link>
      <div className="flex items-center gap-4">
        {isAdmin && (
          <Link href="/admin" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
             <ShieldCheck size={16} /> Admin
          </Link>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </header>
  );
}
