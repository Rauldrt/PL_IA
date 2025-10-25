'use client';

import { useState, useMemo } from 'react';
import AuthChatHeader from '@/components/auth/ChatHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MessageCircle, UserPlus, Trash2, LoaderCircle } from 'lucide-react';
import AdminGuard from '@/components/auth/AdminGuard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface Fiscal {
    id?: string;
    apellidoYNombre: string;
    dni: string;
    rol: 'GENERAL' | 'MESA';
    escuela: string;
    mesa: string;
    telefono: string;
}

function FiscalesPageContent() {
    const { toast } = useToast();
    const firestore = useFirestore();

    const fiscalesCollectionRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'fiscales');
    }, [firestore]);

    const { data: savedFiscales, isLoading: isLoadingFiscales } = useCollection<Fiscal>(fiscalesCollectionRef);
    
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
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <CardTitle>Fiscales Guardados</CardTitle>
                                    <CardDescription className="mt-1">
                                        Visualiza y gestiona los fiscales actualmente en la base de datos.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Link href="/fiscales/cargar" passHref>
                                        <Button>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Cargar Nuevos Fiscales
                                        </Button>
                                    </Link>
                                    <Link href="/chat" passHref>
                                        <Button variant="outline">
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
                        {isLoadingFiscales ? (
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
                                    <CardHeader>
                                        <CardTitle className="text-lg">{escuela}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Apellido y Nombre</TableHead>
                                                    <TableHead>DNI</TableHead>
                                                    <TableHead>Mesa</TableHead>
                                                    <TableHead>Rol</TableHead>
                                                    <TableHead>Acción</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {fiscalesDeEscuela.map((fiscal) => (
                                                    <TableRow key={fiscal.id}>
                                                        <TableCell className="font-medium">{fiscal.apellidoYNombre}</TableCell>
                                                        <TableCell>{fiscal.dni}</TableCell>
                                                        <TableCell>{fiscal.mesa}</TableCell>
                                                        <TableCell>{fiscal.rol}</TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSavedFiscal(fiscal.id!)}>
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
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
        <AdminGuard>
            <FiscalesPageContent />
        </AdminGuard>
    );
}
