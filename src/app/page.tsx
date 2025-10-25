import { Logo } from '@/components/icons';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="flex w-full max-w-sm flex-col items-center justify-center space-y-6">
        <div className="text-center">
          <Logo className="mx-auto h-12 w-auto text-primary" />
          <h1 className="mt-6 font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
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
