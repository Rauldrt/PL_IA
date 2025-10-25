'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';

export function useIsAdmin(userId: string | undefined) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (isUserLoading) {
      setIsLoading(true);
      return;
    }

    if (user?.email === 'rauldrt5@gmail.com') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
    setIsLoading(false);
    
  }, [user, isUserLoading]);

  return { isAdmin, isLoading };
}
