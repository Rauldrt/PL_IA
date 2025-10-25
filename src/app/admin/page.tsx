'use client';

import { useState, useRef } from 'react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, FileUp, FileText } from 'lucide-react';
import AuthChatHeader from '@/components/auth/ChatHeader';

// Configure the worker for pdfjs-dist
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export default function AdminPage() {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Error de archivo',
        description: 'Por favor, selecciona un archivo PDF.',
        variant: 'destructive',
      });
      return;
    }

    setFileName(file.name);
    setIsParsing(true);
    toast({ title: 'Procesando PDF', description: 'Extrayendo texto del archivo...' });

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        if (data) {
          const loadingTask = pdfjsLib.getDocument(new Uint8Array(data as ArrayBuffer));
          const pdf = await loadingTask.promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
            fullText += pageText + '\n\n';
          }
          setContent(fullText);
          toast({
            title: 'Éxito',
            description: 'El contenido del PDF ha sido extraído y cargado en el campo de texto.',
          });
        }
      } catch (error) {
        console.error('Error parsing PDF:', error);
        toast({
          title: 'Error al procesar PDF',
          description: 'No se pudo extraer el texto del archivo.',
          variant: 'destructive',
        });
        setFileName('');
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

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
    
    if (!firestore) {
      toast({
        title: 'Error de Firestore',
        description: 'No se pudo inicializar la base de datos. Inténtalo de nuevo.',
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
      });

      toast({
        title: 'Éxito',
        description: 'Fuente de conocimiento agregada.',
      });
      setName('');
      setContent('');
      setUrl('');
      setFileName('');
    } catch (error: any) {
      console.error('Error adding knowledge source:', error);
      let errorMessage = 'No se pudo guardar la fuente de conocimiento.';
      if (error.code === 'permission-denied') {
        errorMessage = 'No tienes permiso para realizar esta acción. Solo los administradores pueden agregar conocimiento.';
      }
      toast({
        title: 'Error de Firestore',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <AuthChatHeader />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Panel de Administración</CardTitle>
              <CardDescription>
                Agrega nuevas fuentes de conocimiento para entrenar a tu agente de IA. Puedes pegar texto, subir un PDF o proporcionar una URL.
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
                  <label htmlFor="pdf-upload" className="font-medium">
                    Cargar desde PDF
                  </label>
                   <Input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isParsing}
                  >
                    {isParsing ? (
                      <LoaderCircle className="animate-spin" />
                    ) : fileName ? (
                      <>
                        <FileText className="mr-2" /> {fileName}
                      </>
                    ) : (
                      <>
                        <FileUp className="mr-2" /> Seleccionar PDF
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                    <hr className="w-full" />
                    <span className="text-muted-foreground text-sm">O</span>
                    <hr className="w-full" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="content" className="font-medium">
                    Contenido de Texto
                  </label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Pega aquí el contenido del documento o el texto extraído del PDF."
                    rows={10}
                    disabled={isParsing}
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

                <Button type="submit" className="w-full" disabled={isLoading || isParsing}>
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