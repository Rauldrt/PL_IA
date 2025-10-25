'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getSuggestedMessages } from '@/lib/actions';
import { chat } from '@/ai/flows/chat';
import type { Message } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import AuthChatHeader from '@/components/auth/ChatHeader';
import MessageBubble from './MessageBubble';
import ChatInputForm from './ChatInputForm';
import { WelcomeScreen } from './WelcomeScreen';
import { LoaderCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [knowledge, setKnowledge] = useState('');
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const firestore = useFirestore();

  const configRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'config', 'app-settings');
  }, [firestore]);

  const { data: appConfig } = useDoc<{ aiAvatarUrl: string }>(configRef);

  const fetchSuggestions = useCallback(async (knowledgeContent: string) => {
    if (messages.length > 0) return;

    setIsLoadingSuggestions(true);
    try {
      const result = await getSuggestedMessages(knowledgeContent);
      if (result.messages) {
        setSuggested(result.messages);
      } else if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error fetching suggested messages:', error);
      toast({ title: 'Error', description: 'No se pudieron cargar las sugerencias.', variant: 'destructive' });
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [messages.length, toast]);

  useEffect(() => {
    const fetchKnowledge = async () => {
      if (!firestore) return;
      setIsLoading(true);
      const knowledgeCollection = collection(firestore, 'knowledgeSources');
      try {
        const knowledgeSnapshot = await getDocs(knowledgeCollection);
        let allContent = '';
        knowledgeSnapshot.forEach(doc => {
          allContent += doc.data().content + '\n\n';
        });
        setKnowledge(allContent);
        // Fetch suggestions once knowledge is loaded
        fetchSuggestions(allContent);
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: knowledgeCollection.path,
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
        }
        toast({
          title: 'Error de Conocimiento',
          description: 'No se pudo cargar la base de conocimiento.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchKnowledge();
  }, [firestore, toast, fetchSuggestions]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (messageContent: string) => {
    const trimmedMessage = messageContent.trim();
    if (!trimmedMessage || isLoading) return;

    const newUserMessage: Message = { id: Date.now().toString(), role: 'user', content: trimmedMessage };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);
    setInput('');

    try {
      const aiResponse = await chat({
        history: messages.slice(-10), // Pass last 10 messages for context
        message: trimmedMessage,
        knowledge: knowledge,
      });

      const newAiMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: aiResponse.response };
      setMessages((prev) => [...prev, newAiMessage]);
    } catch (e) {
      console.error('Chat error:', e);
      toast({ title: 'Error', description: 'Ocurrió un error inesperado.', variant: 'destructive' });
      setMessages((prev) => prev.slice(0, -1)); // Remove user message on error
    } finally {
      setIsLoading(false);
    }
  };

  const aiAvatarUrl = appConfig?.aiAvatarUrl;

  return (
    <div className="flex h-screen flex-col bg-background">
      <AuthChatHeader />
      <main className="flex-1 overflow-hidden">
        <div className="relative h-full">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
              {messages.length === 0 ? (
                <WelcomeScreen
                  suggestedMessages={suggested}
                  onSuggestionClick={handleSendMessage}
                  isLoading={isLoadingSuggestions || isLoading}
                />
              ) : (
                messages.map((m) => <MessageBubble key={m.id} message={m} aiAvatarUrl={aiAvatarUrl} />)
              )}
              {isLoading && messages.length > 0 && (
                <div className="flex items-start gap-4 py-4 justify-start">
                  <Avatar className="h-8 w-8 border">
                    {aiAvatarUrl && <AvatarImage src={aiAvatarUrl} alt="AI Avatar" />}
                    <AvatarFallback>IA</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center space-x-2 rounded-lg bg-card px-4 py-3 text-sm shadow-sm">
                    <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                    <span>Pensando...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </main>
      <ChatInputForm
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        handleSendMessage={handleSendMessage}
      />
    </div>
  );
}

    