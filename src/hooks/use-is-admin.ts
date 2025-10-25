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

  useEffect(() => {
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
          // Check for the hardcoded admin email as a fallback.
          // Note: This check is client-side only and won't affect security rules.
          const { user } = useUser.getState();
          if (user?.email === 'rauldrt5@gmail.com') {
             setIsAdmin(true);
          } else {
             setIsAdmin(false);
          }
        }
      } catch (error: any) {
        setIsAdmin(false);
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
  }, [userId, firestore]);

  return { isAdmin, isLoading };
}

// Helper function to get latest user state outside of React component lifecycle
useUser.getState = () => {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
      return { user: null };
    }
    return { user: context.user };
};
