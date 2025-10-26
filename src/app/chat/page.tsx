
'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import AuthGuard from '@/components/auth/AuthGuard';
import ChatClient from '@/components/chat/ChatClient';
import { Sidebar, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import ChatHistory from '@/components/chat/ChatHistory';
import AuthChatHeader from '@/components/auth/ChatHeader';

function ChatPageContent() {
  const { user } = useUser();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  if (!user) {
    return null; // or a loading spinner
  }

  return (
    <SidebarProvider>
      <div className="relative flex h-screen w-full flex-col overflow-hidden">
        <AuthChatHeader />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar>
            <ChatHistory userId={user.uid} onSelectSession={setActiveSessionId} activeSessionId={activeSessionId} />
          </Sidebar>
          <SidebarInset>
             <ChatClient userId={user.uid} sessionId={activeSessionId} setSessionId={setActiveSessionId} />
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}


export default function ChatPage() {
  return (
    <AuthGuard>
      <ChatPageContent />
    </AuthGuard>
  );
}
