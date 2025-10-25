'use client';

import { useState } from 'react';
import AuthChatHeader from '@/components/auth/ChatHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MessageCircle, UserPlus, Trash2, ClipboardPaste, LoaderCircle } from 'lucide-react';
import AdminGuard from '@/components/auth/AdminGuard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, writeBatch } from 'firebase/firestore';

interface Fiscal {
    apellidoYNombre: string;
    dni: string;
    esFiscal: boolean;
    escuela: string;
    mesa: string;
    telefono: string;
}

function FiscalesPageContent() {
    const [fiscales, setFiscales] = useState<Fiscal[]>([]);
    const [formState, setFormState] = useState<Fiscal>({
        apellidoYNombre: '',
        dni: '',
        esFiscal: true,
        escuela: '',
        mesa: '',
        telefono: '',
    });
    const [pastedData, setPastedData] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
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
            esFiscal: true,
            escuela: '',
            mesa: '',
            telefono: '',
        });
    };

    const handlePaste = () => {
        const rows = pastedData.trim().split('\n');
        const nuevosFiscales: Fiscal[] = [];
        rows.forEach((row, index) => {
            const columns = row.split('\t');
            if (columns.length >= 6) {
                const [apellidoYNombre, dni, esFiscalStr, escuela, mesa, telefono] = columns;
                nuevosFiscales.push({
                    apellidoYNombre: apellidoYNombre.trim(),
                    dni: dni.trim(),
                    esFiscal: esFiscalStr.trim().toLowerCase() === 'si' || esFiscalStr.trim().toLowerCase() === 'true',
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
            }
        });
        setFiscales(prev => [...prev, ...nuevosFiscales]);
        setPastedData('');
    };

    const handleRemoveFiscal = (index: number) => {
        setFiscales(prev => prev.filter((_, i) => i !== index));
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
        try {
            const batch = writeBatch(firestore);
            const fiscalesCollection = collection(firestore, 'fiscales');
            
            fiscales.forEach(fiscal => {
                const docRef = collection(firestore, 'fiscales').doc();
                batch.set(docRef, fiscal);
            });

            await batch.commit();

            toast({
                title: 'Éxito',
                description: `${fiscales.length} fiscales han sido guardados correctamente.`,
            });
            setFiscales([]);
        } catch (error: any) {
            console.error('Error saving fiscales:', error);
            toast({
                title: 'Error al guardar',
                description: error.message || 'No se pudieron guardar los fiscales en la base de datos.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };


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
                        {/* Manual Entry and Paste Section */}
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
                                        <div className="space-y-2 col-span-2">
                                            <Label htmlFor="telefono">Teléfono</Label>
                                            <Input name="telefono" value={formState.telefono} onChange={handleFormChange} />
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox id="esFiscal" name="esFiscal" checked={formState.esFiscal} onCheckedChange={(checked) => setFormState(prev => ({...prev, esFiscal: !!checked}))} />
                                        <label htmlFor="esFiscal" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Es Fiscal
                                        </label>
                                    </div>
                                    <Button onClick={handleAddManual} className="w-full">
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Agregar a la lista
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Pegar desde Planilla</CardTitle>
                                    <CardDescription>Pega aquí los datos con las columnas: Apellido y Nombre, DNI, Fiscal (si/no), Escuela, Mesa, Telefono.</CardDescription>
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
                        </div>
                        
                        {/* Table Section */}
                        <Card className="lg:col-span-1">
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
                            <CardContent>
                                <div className="max-h-[600px] overflow-auto border rounded-lg">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-muted">
                                            <TableRow>
                                                <TableHead>Apellido y Nombre</TableHead>
                                                <TableHead>DNI</TableHead>
                                                <TableHead>Escuela</TableHead>
                                                <TableHead>Mesa</TableHead>
                                                <TableHead>Es Fiscal</TableHead>
                                                <TableHead>Acción</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {fiscales.length > 0 ? fiscales.map((fiscal, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{fiscal.apellidoYNombre}</TableCell>
                                                    <TableCell>{fiscal.dni}</TableCell>
                                                    <TableCell>{fiscal.escuela}</TableCell>
                                                    <TableCell>{fiscal.mesa}</TableCell>
                                                    <TableCell>{fiscal.esFiscal ? 'Sí' : 'No'}</TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveFiscal(index)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center h-24">
                                                        No hay fiscales en la lista.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
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
