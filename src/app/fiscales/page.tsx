'use client';

import { useState, useMemo } from 'react';
import AuthChatHeader from '@/components/auth/ChatHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MessageCircle, UserPlus, Trash2, LoaderCircle, FileDown } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useIsAdmin } from '@/hooks/use-is-admin';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { SidebarProvider } from '@/components/ui/sidebar';


interface Fiscal {
    id?: string;
    apellidoYNombre: string;
    dni: string;
    rol: 'GENERAL' | 'MESA';
    escuela: string;
    mesa: string;
    telefono: string;
}

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
);


function FiscalesPageContent() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const { isAdmin, isLoading: isAdminLoading } = useIsAdmin(user?.uid);

    const fiscalesCollectionRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'fiscales');
    }, [firestore]);

    const { data: savedFiscales, isLoading: isLoadingFiscales } = useCollection<Fiscal>(fiscalesCollectionRef);
    
    const handleExportAndSharePDF = () => {
        if (!savedFiscales || savedFiscales.length === 0) {
            toast({
                title: "No hay datos",
                description: "No hay fiscales guardados para exportar.",
                variant: "destructive"
            });
            return;
        }

        const doc = new jsPDF();

        // Añadir un título al PDF
        doc.setFontSize(18);
        doc.text("Listado de Fiscales", 14, 22);
        
        const tableColumn = ["Apellido y Nombre", "DNI", "Escuela", "Mesa", "Teléfono"];
        const tableRows: (string | null)[][] = [];

        savedFiscales.forEach(fiscal => {
            const fiscalData = [
                fiscal.apellidoYNombre,
                fiscal.dni,
                fiscal.escuela,
                fiscal.mesa,
                fiscal.telefono,
            ];
            tableRows.push(fiscalData);
        });

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
        });

        doc.save('fiscales.pdf');
    };

    const handleDeleteSavedFiscal = async (fiscalId: string) => {
        if (!firestore) return;
        
        toast({
          title: 'Eliminando fiscal...',
          description: 'Por favor, espera.',
        });

        const docRef = doc(firestore, 'fiscales', fiscalId);
        
        deleteDoc(docRef)
        .then(() => {
          toast({
            title: 'Éxito',
            description: 'El fiscal ha sido eliminado.',
          });
        })
        .catch((serverError) => {
            if (serverError.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'delete',
                });
                errorEmitter.emit('permission-error', permissionError);
            } else {
                 toast({
                    title: 'Error al eliminar',
                    description: serverError.message || 'No se pudo eliminar el fiscal.',
                    variant: 'destructive',
                });
            }
        });
    };

    const formatWhatsAppLink = (phone: string) => {
        let cleanedPhone = phone.replace(/[^0-9]/g, '');
        if (cleanedPhone.length > 8 && !cleanedPhone.startsWith('54')) {
            cleanedPhone = `54${cleanedPhone}`;
        }
        return `https://wa.me/${cleanedPhone}`;
    };

    const savedFiscalesByEscuela = useMemo(() => {
        if (!savedFiscales) return {};
        return savedFiscales.reduce((acc, fiscal) => {
            const escuela = fiscal.escuela || 'Sin Escuela Asignada';
            if (!acc[escuela]) {
                acc[escuela] = [];
            }
            acc[escuela].push(fiscal);
            return acc;
        }, {} as Record<string, Fiscal[]>);
    }, [savedFiscales]);


    return (
        <div className="flex h-screen flex-col bg-background">
            <AuthChatHeader />
            <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl space-y-8">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                <div className="flex-1">
                                    <CardTitle>Fiscales Guardados</CardTitle>
                                    <CardDescription className="mt-1">
                                        Visualiza y gestiona los fiscales actualmente en la base de datos.
                                    </CardDescription>
                                </div>
                                <div className="flex w-full sm:w-auto flex-col sm:flex-row items-center gap-2">
                                     { !isAdminLoading && isAdmin && (
                                        <>
                                            <Button onClick={handleExportAndSharePDF} className="w-full sm:w-auto">
                                                <FileDown className="mr-2 h-4 w-4" />
                                                Exportar PDF
                                            </Button>
                                            <Link href="/fiscales/cargar" passHref className="w-full sm:w-auto">
                                                <Button className="w-full">
                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                    Cargar Nuevos
                                                </Button>
                                            </Link>
                                        </>
                                     )}
                                    <Link href="/chat" passHref className="w-full sm:w-auto">
                                        <Button variant="outline" className="w-full">
                                            <MessageCircle className="mr-2 h-4 w-4" />
                                            Volver al Chat
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    <div className="space-y-6">
                        <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-auto pr-2">
                        {isLoadingFiscales || isAdminLoading ? (
                            <div className="flex justify-center items-center pt-10">
                                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : Object.keys(savedFiscalesByEscuela).length === 0 ? (
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-center text-muted-foreground">No hay fiscales guardados en la base de datos.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            Object.entries(savedFiscalesByEscuela).map(([escuela, fiscalesDeEscuela]) => (
                                <Card key={escuela}>
                                    <CardHeader className="py-4 px-4 sm:px-6">
                                        <CardTitle className="text-lg">{escuela}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                          <Table>
                                              <TableHeader>
                                                  <TableRow>
                                                      <TableHead>Apellido y Nombre</TableHead>
                                                      <TableHead className="hidden sm:table-cell">DNI</TableHead>
                                                      <TableHead>Mesa</TableHead>
                                                      <TableHead className="hidden md:table-cell">Rol</TableHead>
                                                      <TableHead>Contacto</TableHead>
                                                      {isAdmin && <TableHead className="text-right">Acción</TableHead>}
                                                  </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                  {fiscalesDeEscuela.map((fiscal) => (
                                                      <TableRow key={fiscal.id}>
                                                          <TableCell className="font-medium max-w-[150px] truncate sm:max-w-none">{fiscal.apellidoYNombre}</TableCell>
                                                          <TableCell className="hidden sm:table-cell">{fiscal.dni}</TableCell>
                                                          <TableCell>{fiscal.mesa}</TableCell>
                                                          <TableCell className="hidden md:table-cell">{fiscal.rol}</TableCell>
                                                          <TableCell>
                                                              <Button asChild variant="ghost" size="icon" disabled={!fiscal.telefono}>
                                                                  <a href={formatWhatsAppLink(fiscal.telefono)} target="_blank" rel="noopener noreferrer">
                                                                       <WhatsAppIcon className="h-5 w-5 text-green-500" />
                                                                  </a>
                                                              </Button>
                                                          </TableCell>
                                                          {isAdmin && (
                                                              <TableCell className="text-right">
                                                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteSavedFiscal(fiscal.id!)}>
                                                                      <Trash2 className="h-4 w-4 text-destructive" />
                                                                  </Button>
                                                              </TableCell>
                                                          )}
                                                      </TableRow>
                                                  ))}
                                              </TableBody>
                                          </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}


export default function FiscalesPage() {
    return (
        <AuthGuard>
            <SidebarProvider>
                <FiscalesPageContent />
            </SidebarProvider>
        </AuthGuard>
    );
}
