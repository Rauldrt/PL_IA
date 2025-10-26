
'use client';

import { PlusCircle, MessageSquareText, LoaderCircle } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Session } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';


interface ChatHistoryProps {
  userId: string;
  activeSessionId: string | null;
  onSelectSession: (sessionId: string | null) => void;
}

export default function ChatHistory({ userId, activeSessionId, onSelectSession }: ChatHistoryProps) {
  const firestore = useFirestore();

  const sessionsCollectionRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return collection(firestore, 'users', userId, 'sessions');
  }, [firestore, userId]);
  
  const sessionsQuery = useMemoFirebase(() => {
    if (!sessionsCollectionRef) return null;
    return query(sessionsCollectionRef, orderBy('startTime', 'desc'), limit(20));
  }, [sessionsCollectionRef]);
  
  const { data: sessions, isLoading } = useCollection<Session>(sessionsQuery);

  return (
    <>
      <SidebarHeader>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => onSelectSession(null)}
        >
          <PlusCircle className="mr-2" />
          Nuevo Chat
        </Button>
      </SidebarHeader>
      <SidebarContent className="p-2">
         {isLoading && (
            <div className="flex items-center justify-center p-4">
                <LoaderCircle className="animate-spin text-primary" />
            </div>
         )}
        <SidebarMenu>
          {sessions && sessions.map(session => (
            <SidebarMenuItem key={session.id}>
              <SidebarMenuButton
                isActive={activeSessionId === session.id}
                onClick={() => onSelectSession(session.id)}
                className="h-auto flex-col items-start"
              >
                <div className="flex w-full items-center">
                    <MessageSquareText className="mr-2 flex-shrink-0" />
                    <span className="truncate flex-grow">
                        {session.lastMessage || 'Nuevo Chat'}
                    </span>
                </div>
                 {session.startTime && (
                    <span className="text-xs text-muted-foreground self-end mt-1">
                        {formatDistanceToNow(session.startTime.toDate(), { addSuffix: true, locale: es })}
                    </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        {/* Footer content can go here */}
      </SidebarFooter>
    </>
  );
}

    