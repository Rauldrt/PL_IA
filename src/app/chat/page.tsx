import AuthGuard from '@/components/auth/AuthGuard';
import ChatClient from '@/components/chat/ChatClient';

export default function ChatPage() {
  return (
    <AuthGuard>
      <ChatClient />
    </AuthGuard>
  );
}
