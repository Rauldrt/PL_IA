'use client';

import AuthChatHeader from '@/components/auth/ChatHeader';
import AuthGuard from '@/components/auth/AuthGuard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import AdminGuard from '@/components/auth/AdminGuard';


function FiscalesPageContent() {
    return (
        <div className="flex h-screen flex-col bg-background">
            <AuthChatHeader />
            <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-4xl space-y-8">
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <CardTitle>Portal de Fiscales</CardTitle>
                                    <CardDescription className="mt-1">
                                        Realiza consultas y gestiona la información fiscal aquí.
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
                        <CardContent>
                            <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                                <p className="text-muted-foreground">Próximamente: Herramientas y consultas para fiscales.</p>
                            </div>
                        </CardContent>
                    </Card>
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
