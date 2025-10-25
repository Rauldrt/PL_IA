
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getSuggestedMessages } from '@/lib/actions';
import { chat } from '@/ai/flows/chat';
import type { Message } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageBubble from './MessageBubble';
import ChatInputForm from './ChatInputForm';
import { WelcomeScreen } from './WelcomeScreen';
import { LoaderCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface ChatClientProps {
    userId: string;
    sessionId: string | null;
    setSessionId: (sessionId: string) => void;
}

export default function ChatClient({ userId, sessionId, setSessionId }: ChatClientProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [knowledge, setKnowledge] = useState('');
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const firestore = useFirestore();

  const aiAvatar = PlaceHolderImages.find(p => p.id === 'ai-avatar');
  const aiAvatarUrl = aiAvatar?.imageUrl;

  // --- Firestore references ---
  const messagesCollectionRef = useMemoFirebase(() => {
    if (!firestore || !userId || !sessionId) return null;
    return collection(firestore, 'users', userId, 'sessions', sessionId, 'messages');
  }, [firestore, userId, sessionId]);

  const messagesQuery = useMemoFirebase(() => {
    if (!messagesCollectionRef) return null;
    return query(messagesCollectionRef, orderBy('timestamp', 'asc'));
  }, [messagesCollectionRef]);

  // --- Data hooks ---
  const { data: messages = [], isLoading: isLoadingMessages } = useCollection<Message>(messagesQuery);

  // --- Functions ---
  const createNewSession = useCallback(async () => {
    if (!firestore || !userId) return null;
    try {
        const sessionsCollection = collection(firestore, 'users', userId, 'sessions');
        const newSessionDoc = await addDoc(sessionsCollection, {
            startTime: serverTimestamp(),
            userId: userId,
        });
        setSessionId(newSessionDoc.id);
        return newSessionDoc.id;
    } catch (error) {
        console.error("Error creating new session:", error);
        toast({ title: 'Error', description: 'No se pudo iniciar una nueva sesión de chat.', variant: 'destructive'});
        return null;
    }
  }, [firestore, userId, setSessionId, toast]);


  const saveMessage = async (message: Omit<Message, 'id'>) => {
    if (!messagesCollectionRef) return;
    try {
      await addDoc(messagesCollectionRef, {
        ...message,
        timestamp: serverTimestamp(),
      });
    } catch (error: any) {
       if (error.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: messagesCollectionRef.path,
            operation: 'create',
            requestResourceData: message
          });
          errorEmitter.emit('permission-error', permissionError);
        } else {
            console.error("Error saving message:", error);
            toast({ title: 'Error', description: 'No se pudo guardar el mensaje.', variant: 'destructive'});
        }
    }
  };

  const handleSendMessage = async (messageContent: string) => {
    const trimmedMessage = messageContent.trim();
    if (!trimmedMessage || isLoading) return;

    let currentSessionId = sessionId;
    // If there's no active session, create one first.
    if (!currentSessionId) {
        setIsLoading(true);
        currentSessionId = await createNewSession();
        if (!currentSessionId) {
            setIsLoading(false);
            return; // Stop if session creation failed
        }
    }
    
    const userMessages = messages || [];
    const newUserMessage: Omit<Message, 'id'> = { role: 'user', content: trimmedMessage };
    await saveMessage(newUserMessage);
    
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await chat({
        history: userMessages.slice(-10).map(({ id, ...rest }) => rest), // Pass history without IDs
        message: trimmedMessage,
        knowledge: knowledge,
      });

      const newAiMessage: Omit<Message, 'id'> = { role: 'assistant', content: aiResponse.response };
      await saveMessage(newAiMessage);

    } catch (e) {
      console.error('Chat error:', e);
      toast({ title: 'Error', description: 'Ocurrió un error inesperado.', variant: 'destructive' });
      // Optionally remove the user message from UI if saving failed, though it's already saved.
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- Effects ---

  const fetchSuggestions = useCallback(async (knowledgeContent: string) => {
    if (!messages || messages.length > 0) return;

    setIsLoadingSuggestions(true);
    try {
      const result = await getSuggestedMessages({knowledge: knowledgeContent});
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
  }, [messages, toast]);

  useEffect(() => {
    const fetchKnowledge = async () => {
      if (!firestore) return;
      // We only fetch knowledge if we are starting a new chat
      if (sessionId) return;

      setIsLoading(true);
      const knowledgeCollection = collection(firestore, 'knowledgeSources');
      try {
        const knowledgeSnapshot = await getDocs(knowledgeCollection);
        let allContent = '';
        knowledgeSnapshot.forEach(doc => {
          allContent += doc.data().content + '\n\n';
        });
        setKnowledge(allContent);
        fetchSuggestions(allContent);
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: knowledgeCollection.path,
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
        } else {
           toast({
            title: 'Error de Conocimiento',
            description: 'No se pudo cargar la base de conocimiento.',
            variant: 'destructive',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchKnowledge();
  }, [firestore, toast, fetchSuggestions, sessionId]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading, isLoadingMessages]);

  const hasMessages = messages && messages.length > 0;
  const isChatReady = !isLoadingMessages && sessionId;
  const showWelcome = !isLoadingMessages && !hasMessages;

  return (
    <div className="flex h-full flex-col bg-background">
      <main className="flex-1 overflow-hidden">
        <div className="relative h-full">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
               {isLoadingMessages && <div className="flex justify-center items-center h-full"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>}

              {showWelcome && (
                <WelcomeScreen
                  suggestedMessages={suggested}
                  onSuggestionClick={handleSendMessage}
                  isLoading={isLoadingSuggestions || isLoading}
                />
              )}
              
              {isChatReady && messages && (
                messages.map((m) => <MessageBubble key={m.id} message={m} aiAvatarUrl={aiAvatarUrl} />)
              )}

              {isLoading && hasMessages && (
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
