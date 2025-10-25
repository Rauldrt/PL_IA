'use client';

import { Logo } from '@/components/icons';
import Link from 'next/link';

export default function ChatHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-6">
      <Link href="/chat" className="flex items-center gap-3">
        <Logo className="h-8 w-8 text-primary" />
        <h1 className="font-headline text-xl font-bold text-foreground">Conecta IA</h1>
      </Link>
      <Link href="/admin" className="text-sm font-medium text-primary hover:underline">
        Admin
      </Link>
    </header>
  );
}