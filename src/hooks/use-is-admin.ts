'use client';

import { useState, useEffect, useContext } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore, useUser, FirebaseContext } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useIsAdmin(userId: string | undefined) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const firestore = useFirestore();
  const context = useContext(FirebaseContext);
  
  useEffect(() => {
    if (!firestore) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }
    
    // Immediately check for hardcoded admin email, which is faster.
    const currentUser = context?.user;
    if (currentUser?.email === 'rauldrt5@gmail.com') {
        setIsAdmin(true);
        setIsLoading(false);
        return;
    }

    // If not the hardcoded admin, or if user is not available yet, proceed with Firestore check.
    if (!userId) {
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
          // Final check, if firestore check fails, fall back to email.
           if (currentUser?.email === 'rauldrt5@gmail.com') {
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
  }, [userId, firestore, context?.user]);

  return { isAdmin, isLoading };
}
