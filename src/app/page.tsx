'use client';

import LoginForm from '@/components/auth/LoginForm';
import { Logo } from '@/components/icons';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="flex w-full max-w-sm flex-col items-center justify-center space-y-6">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="animated-gradient-bg absolute -inset-2 rounded-2xl bg-gradient-to-r from-red-500 via-green-500 via-blue-500 to-yellow-500 opacity-75 blur-lg"></div>
            <div className="relative flex items-center justify-center rounded-lg bg-card p-6 shadow-lg">
                <Logo width={128} height={128} />
            </div>
          </div>
          <h1 className="mt-8 font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Bienvenido a Conecta IA
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            Inicia sesión o crea una cuenta para conversar con tu agente de IA.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
