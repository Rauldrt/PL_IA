
'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getSuggestedMessages } from '@/ai/flows/suggested-messages';
import { chat } from '@/ai/flows/chat';
import type { Message } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageBubble from './MessageBubble';
import ChatInputForm from './ChatInputForm';
import { WelcomeScreen } from './WelcomeScreen';
import { LoaderCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs, doc, addDoc, serverTimestamp, orderBy, setDoc } from 'firebase/firestore';
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
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [knowledge, setKnowledge] = useState('');
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const firestore = useFirestore();

  const aiAvatar = PlaceHolderImages.find(p => p.id === 'ai-avatar');
  const aiAvatarUrl = aiAvatar?.imageUrl;

  const messagesCollectionRef = useMemoFirebase(() => {
    if (!firestore || !userId || !sessionId) return null;
    return collection(firestore, 'users', userId, 'sessions', sessionId, 'messages');
  }, [firestore, userId, sessionId]);

  const messagesQuery = useMemoFirebase(() => {
    if (!messagesCollectionRef) return null;
    return query(messagesCollectionRef, orderBy('timestamp', 'asc'));
  }, [messagesCollectionRef]);

  const { data: messages = [], isLoading: isLoadingMessages } = useCollection<Message>(messagesQuery);

  const createNewSession = (): Promise<string | null> => {
    return new Promise((resolve) => {
        if (!firestore || !userId) {
            toast({ title: 'Error', description: 'No se pudo iniciar una nueva sesión de chat.', variant: 'destructive'});
            resolve(null);
            return;
        }

        const sessionsCollection = collection(firestore, 'users', userId, 'sessions');
        const sessionData = {
            startTime: serverTimestamp(),
            userId: userId,
        };
        addDoc(sessionsCollection, sessionData)
        .then(newSessionDoc => {
            setSessionId(newSessionDoc.id);
            resolve(newSessionDoc.id);
        })
        .catch(serverError => {
            if (serverError.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: sessionsCollection.path,
                    operation: 'create',
                    requestResourceData: { startTime: new Date(), userId },
                });
                errorEmitter.emit('permission-error', permissionError);
            } else {
                console.error("Error creating new session:", serverError);
                toast({ title: 'Error', description: 'No se pudo iniciar una nueva sesión de chat.', variant: 'destructive'});
            }
            resolve(null);
        });
    });
  };

  const saveMessage = (message: Omit<Message, 'id'>, currentSessionId: string) => {
     if (!firestore || !userId || !currentSessionId) return;

    const messagesCollection = collection(firestore, 'users', userId, 'sessions', currentSessionId, 'messages');

    const messageData = {
        ...message,
        timestamp: serverTimestamp(),
      };

    addDoc(messagesCollection, messageData)
        .catch(serverError => {
            if (serverError.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: messagesCollection.path,
                    operation: 'create',
                    requestResourceData: messageData,
                });
                errorEmitter.emit('permission-error', permissionError);
            } else {
                console.error("Error saving message:", serverError);
                toast({ title: 'Error', description: 'No se pudo guardar el mensaje.', variant: 'destructive'});
            }
        });
  };

  const handleSendMessage = async (messageContent: string) => {
    const trimmedMessage = messageContent.trim();
    if (!trimmedMessage || isAiResponding) return;

    let currentSessionId = sessionId;
    if (!currentSessionId) {
        const newSessionId = await createNewSession();
        if (!newSessionId) {
            return;
        }
        currentSessionId = newSessionId;
    }

    const newUserMessage: Omit<Message, 'id' | 'timestamp'> = { role: 'user', content: trimmedMessage };
    saveMessage(newUserMessage, currentSessionId);

    setInput('');
    setIsAiResponding(true);

    try {
      const historyForAI = (messages || []).map(m => ({
        role: m.role,
        content: m.content,
      }));
      historyForAI.push(newUserMessage);

      const aiResponse = await chat({
        history: historyForAI.slice(-10),
        message: trimmedMessage,
        knowledge: knowledge,
        sessionId: currentSessionId,
      });

      const newAiMessage: Omit<Message, 'id' | 'timestamp'> = { role: 'assistant', content: aiResponse.response };
      saveMessage(newAiMessage, currentSessionId);

    } catch (e) {
      console.error('Chat error:', e);
      toast({ title: 'Error', description: 'Ocurrió un error inesperado.', variant: 'destructive' });
    } finally {
      setIsAiResponding(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!firestore) {
         setIsLoadingInitialData(false);
         return;
      };

      if (!sessionId) {
          setIsLoadingInitialData(true);
          try {
              const knowledgeCollection = collection(firestore, 'knowledgeSources');
              const knowledgeSnapshot = await getDocs(knowledgeCollection);
              let allContent = '';
              knowledgeSnapshot.forEach(doc => {
                  allContent += doc.data().content + '\n\n';
              });
              setKnowledge(allContent);

              const result = await getSuggestedMessages({ knowledge: allContent });
              if (result.messages) {
                  setSuggested(result.messages);
              }

          } catch (error: any) {
              if (error.code === 'permission-denied') {
                  const permissionError = new FirestorePermissionError({
                      path: collection(firestore, 'knowledgeSources').path,
                      operation: 'list',
                  });
                  errorEmitter.emit('permission-error', permissionError);
              } else {
                  toast({
                      title: 'Error de Conocimiento',
                      description: 'No se pudo cargar la base de conocimiento o las sugerencias.',
                      variant: 'destructive',
                  });
              }
          } finally {
              setIsLoadingInitialData(false);
          }
      } else {
        setIsLoadingInitialData(false);
        setSuggested([]); 
      }
    };

    fetchInitialData();
  }, [firestore, sessionId, toast]);


  useEffect(() => {
    // Scroll to the bottom when messages change.
    // The timeout gives React a moment to render the new message.
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }
    }, 0);
  }, [messages]);

  const hasMessages = messages && messages.length > 0;
  const showWelcome = !sessionId && !hasMessages && !isLoadingInitialData;
  const showMainLoader = (isLoadingInitialData && !sessionId) || (isLoadingMessages && !!sessionId);


  return (
    <div className="flex h-full flex-col">
       <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
            {showMainLoader && (
              <div className="flex h-full items-center justify-center">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {!showMainLoader && showWelcome && (
              <WelcomeScreen
                suggestedMessages={suggested}
                onSuggestionClick={handleSendMessage}
                isLoading={isLoadingInitialData}
              />
            )}

            {!showMainLoader && hasMessages && messages.map((m) => <MessageBubble key={m.id} message={m} aiAvatarUrl={aiAvatarUrl} />)}

            {isAiResponding && (
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
      <ChatInputForm
        input={input}
        setInput={setInput}
        isLoading={isAiResponding}
        handleSendMessage={handleSendMessage}
      />
    </div>
  );
}
