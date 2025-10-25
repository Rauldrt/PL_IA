'use client';

import { useState, useMemo } from 'react';
import AuthChatHeader from '@/components/auth/ChatHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MessageCircle, UserPlus, Trash2, ClipboardPaste, LoaderCircle } from 'lucide-react';
import AdminGuard from '@/components/auth/AdminGuard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    const [fiscales, setFiscales] = useState<Omit<Fiscal, 'id'>[]>([]);
    const [formState, setFormState] = useState<Omit<Fiscal, 'id'>>({
        apellidoYNombre: '',
        dni: '',
        rol: 'MESA',
        escuela: '',
        mesa: '',
        telefono: '',
    });
    const [pastedData, setPastedData] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const fiscalesCollectionRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'fiscales');
    }, [firestore]);

    const { data: savedFiscales, isLoading: isLoadingFiscales } = useCollection<Fiscal>(fiscalesCollectionRef);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleRolChange = (value: 'GENERAL' | 'MESA') => {
        setFormState(prev => ({...prev, rol: value}));
    };

    const handleAddManual = () => {
        if (!formState.apellidoYNombre || !formState.dni) {
            toast({
                title: 'Campos requeridos',
                description: 'Apellido y Nombre y DNI son obligatorios.',
                variant: 'destructive',
            });
            return;
        }
        setFiscales(prev => [...prev, formState]);
        setFormState({
            apellidoYNombre: '',
            dni: '',
            rol: 'MESA',
            escuela: '',
            mesa: '',
            telefono: '',
        });
    };

    const handlePaste = () => {
        const rows = pastedData.trim().split('\n');
        const nuevosFiscales: Omit<Fiscal, 'id'>[] = [];
        let parsingError = false;

        rows.forEach((row, index) => {
            if (parsingError) return;

            let columns = row.split('\t');
            if (columns.length < 6) {
                columns = row.split(',').map(s => s.trim());
            }

            if (columns.length >= 6) {
                const [apellidoYNombre, dni, rol, escuela, mesa, telefono] = columns;
                const parsedRol = rol.trim().toUpperCase() === 'GENERAL' ? 'GENERAL' : 'MESA';
                nuevosFiscales.push({
                    apellidoYNombre: apellidoYNombre.trim(),
                    dni: dni.trim(),
                    rol: parsedRol,
                    escuela: escuela.trim(),
                    mesa: mesa.trim(),
                    telefono: telefono.trim(),
                });
            } else {
                toast({
                    title: `Error en fila ${index + 1}`,
                    description: 'La fila no tiene el número de columnas esperado (6).',
                    variant: 'destructive',
                });
                parsingError = true;
            }
        });

        if (!parsingError) {
            setFiscales(prev => [...prev, ...nuevosFiscales]);
            setPastedData('');
            toast({
                title: 'Datos procesados',
                description: `${nuevosFiscales.length} fiscales agregados a la lista.`,
            });
        }
    };

    const handleRemoveFiscal = (dniToRemove: string) => {
        setFiscales(prev => prev.filter(fiscal => fiscal.dni !== dniToRemove));
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
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    };


    const handleSaveAll = async () => {
        if (fiscales.length === 0) {
            toast({
                title: 'No hay fiscales para guardar',
                description: 'Agrega al menos un fiscal antes de guardar.',
                variant: 'destructive',
            });
            return;
        }

        if (!firestore) {
            toast({ title: 'Error', description: 'Servicio de base de datos no disponible.', variant: 'destructive' });
            return;
        }

        setIsSaving(true);
        
        const batch = writeBatch(firestore);
        const fiscalesCollection = collection(firestore, 'fiscales');
        
        fiscales.forEach(fiscal => {
            const docRef = doc(fiscalesCollection);
            batch.set(docRef, fiscal);
        });

        batch.commit()
            .then(() => {
                toast({
                    title: 'Éxito',
                    description: `${fiscales.length} fiscales han sido guardados correctamente.`,
                });
                setFiscales([]);
            })
            .catch((error: any) => {
                const fiscalesCollectionPath = 'fiscales';
                const permissionError = new FirestorePermissionError({
                    path: fiscalesCollectionPath,
                    operation: 'create',
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setIsSaving(false);
            });
    };
    
    const fiscalesByEscuela = useMemo(() => {
        return fiscales.reduce((acc, fiscal) => {
            const escuela = fiscal.escuela || 'Sin Escuela Asignada';
            if (!acc[escuela]) {
                acc[escuela] = [];
            }
            acc[escuela].push(fiscal);
            return acc;
        }, {} as Record<string, Omit<Fiscal, 'id'>[]>);
    }, [fiscales]);

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
                                    <CardTitle>Portal de Fiscales</CardTitle>
                                    <CardDescription className="mt-1">
                                        Agrega y gestiona los fiscales para las elecciones.
                                    </CardDescription>
                                </div>
                                <Link href="/chat" passHref>
                                    <Button variant="outline">
                                        <MessageCircle className="mr-2 h-4 w-4" />
                                        Volver al Chat
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                    </Card>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        {/* Entry Column */}
                        <div className="space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Agregar Fiscal Manualmente</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="apellidoYNombre">Apellido y Nombre</Label>
                                            <Input name="apellidoYNombre" value={formState.apellidoYNombre} onChange={handleFormChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="dni">DNI</Label>
                                            <Input name="dni" value={formState.dni} onChange={handleFormChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="escuela">Escuela</Label>
                                            <Input name="escuela" value={formState.escuela} onChange={handleFormChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="mesa">Mesa</Label>
                                            <Input name="mesa" value={formState.mesa} onChange={handleFormChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="telefono">Teléfono</Label>
                                            <Input name="telefono" value={formState.telefono} onChange={handleFormChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="rol">Rol</Label>
                                            <Select name="rol" value={formState.rol} onValueChange={handleRolChange}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar rol" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="MESA">Mesa</SelectItem>
                                                    <SelectItem value="GENERAL">General</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <Button onClick={handleAddManual} className="w-full mt-4">
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Agregar a la lista
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Pegar desde Planilla</CardTitle>
                                    <CardDescription>Pega aquí los datos con las columnas: Apellido y Nombre, DNI, Rol (GENERAL/MESA), Escuela, Mesa, Telefono.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Textarea
                                        placeholder="Copia y pega desde Excel, Google Sheets, etc."
                                        value={pastedData}
                                        onChange={(e) => setPastedData(e.target.value)}
                                        rows={6}
                                    />
                                    <Button onClick={handlePaste} className="w-full">
                                        <ClipboardPaste className="mr-2 h-4 w-4" />
                                        Procesar y Agregar
                                    </Button>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Fiscales para Guardar</CardTitle>
                                        <CardDescription>
                                            Actualmente hay {fiscales.length} fiscales en la lista para ser guardados.
                                        </CardDescription>
                                    </div>
                                    <Button onClick={handleSaveAll} disabled={fiscales.length === 0 || isSaving}>
                                        {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/> : null}
                                        Guardar Todo
                                    </Button>
                                </div>
                                </CardHeader>
                                <CardContent className="max-h-[500px] overflow-y-auto space-y-4">
                                {Object.keys(fiscalesByEscuela).length === 0 ? (
                                    <p className="text-center text-muted-foreground pt-4">No hay fiscales en la lista para guardar.</p>
                                ) : (
                                    Object.entries(fiscalesByEscuela).map(([escuela, fiscalesDeEscuela]) => (
                                        <Card key={escuela} className="bg-muted/50">
                                            <CardHeader className="py-3">
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
                                                            <TableRow key={fiscal.dni}>
                                                                <TableCell className="font-medium">{fiscal.apellidoYNombre}</TableCell>
                                                                <TableCell>{fiscal.dni}</TableCell>
                                                                <TableCell>{fiscal.mesa}</TableCell>
                                                                <TableCell>{fiscal.rol}</TableCell>
                                                                <TableCell>
                                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveFiscal(fiscal.dni)}>
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
                                </CardContent>
                            </Card>
                        </div>
                        
                        {/* Saved Fiscales Column */}
                        <div className="space-y-6 lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Fiscales Guardados</CardTitle>
                                    <CardDescription>
                                        Estos son los fiscales actualmente en la base de datos.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                            <div className="space-y-4 max-h-[1200px] overflow-auto pr-2">
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

    