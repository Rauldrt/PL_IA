'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import ChatHeader from '@/components/chat/ChatHeader';

export default function AdminPage() {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || (!content && !url)) {
      toast({
        title: 'Error de validación',
        description: 'El nombre es obligatorio y debes proporcionar contenido o una URL.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);

    try {
      const knowledgeCollection = collection(firestore, 'knowledgeSources');
      await addDoc(knowledgeCollection, {
        name,
        content,
        url,
        uploadDate: serverTimestamp(),
        // Eventually, we'll add the userId here
      });

      toast({
        title: 'Éxito',
        description: 'Fuente de conocimiento agregada.',
      });
      setName('');
      setContent('');
      setUrl('');
    } catch (error: any) {
      console.error('Error adding knowledge source:', error);
      toast({
        title: 'Error de Firestore',
        description: 'No se pudo guardar la fuente de conocimiento. Revisa los permisos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <ChatHeader />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Panel de Administración</CardTitle>
              <CardDescription>
                Agrega nuevas fuentes de conocimiento para entrenar a tu agente de IA.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="font-medium">
                    Nombre de la Fuente
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Documento de políticas de la empresa"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="content" className="font-medium">
                    Contenido de Texto
                  </label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Pega aquí el contenido del documento o la información."
                    rows={10}
                  />
                </div>

                <div className="flex items-center gap-4">
                    <hr className="w-full" />
                    <span className="text-muted-foreground text-sm">O</span>
                    <hr className="w-full" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="url" className="font-medium">
                    URL de la Fuente
                  </label>
                  <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://ejemplo.com/documento"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    'Agregar Fuente de Conocimiento'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
