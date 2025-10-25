'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export default function AuthChatHeader() {
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user && firestore) {
        const adminRoleDocRef = doc(firestore, `roles_admin/${user.uid}`);
        try {
          const docSnap = await getDoc(adminRoleDocRef);
          setIsAdmin(docSnap.exists());
        } catch (error) {
            // This is likely a permission error on the read itself.
            const permissionError = new FirestorePermissionError({
                path: adminRoleDocRef.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);

            // Inform user via toast, but the developer overlay will have the rich error.
            toast({
              title: 'Error de Permiso',
              description: 'No se pudo verificar el estado de administrador.',
              variant: 'destructive',
            });
            setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [user, firestore, toast]);

  const handleLogout = async () => {
    if (auth) {
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
