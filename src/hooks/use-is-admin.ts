'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useIsAdmin(userId: string | undefined) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const firestore = useFirestore();
  const { user } = useUser(); // Get the full user object

  useEffect(() => {
    // Hardcode admin access for a specific email
    if (user?.email === 'rauldrt5@gmail.com') {
      setIsAdmin(true);
      setIsLoading(false);
      return;
    }

    if (!userId || !firestore) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    const checkAdminStatus = async () => {
      setIsLoading(true);
      const adminRoleDocRef = doc(firestore, 'roles_admin', userId);
      try {
        const docSnap = await getDoc(adminRoleDocRef);
        if (docSnap.exists() && docSnap.data()?.isAdmin === true) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error: any) {
        setIsAdmin(false);
        // This is likely a permission error if the rules are set up correctly.
        // We emit it to be caught by the global error handler.
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: adminRoleDocRef.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [userId, firestore, user]);

  return { isAdmin, isLoading };
}
