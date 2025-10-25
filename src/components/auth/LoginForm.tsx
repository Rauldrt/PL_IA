'use client';

import React, { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login, signup } from '@/firebase/auth/actions';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

function SubmitButton({ isSignup }: { isSignup: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? (
        <LoaderCircle className="animate-spin" />
      ) : isSignup ? (
        'Crear Cuenta'
      ) : (
        <>
          Iniciar Sesión <ArrowRight />
        </>
      )}
    </Button>
  );
}

export default function LoginForm() {
  const [isSignup, setIsSignup] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const handleAuthAction = async (prevState: any, formData: FormData) => {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (isSignup) {
      const result = await signup(prevState, formData);
      if (result.success) {
        toast({ title: 'Éxito', description: 'Cuenta creada. Ahora puedes iniciar sesión.' });
        setIsSignup(false);
      } else if (result.message) {
        toast({ title: 'Error de registro', description: result.message, variant: 'destructive' });
      }
      return result;
    } else {
      if (!auth) {
         toast({ title: 'Error', description: 'Servicio de autenticación no disponible.', variant: 'destructive' });
         return { message: 'Servicio de autenticación no disponible.', success: false };
      }
      try {
          await signInWithEmailAndPassword(auth, email, password);
          toast({ title: 'Éxito', description: 'Inicio de sesión exitoso.' });
          router.push('/chat');
          return { message: 'Success', success: true };
        } catch (error: any) {
           let message = 'Ocurrió un error inesperado.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                message = 'El email o la contraseña son incorrectos.';
            }
          toast({ title: 'Error de inicio de sesión', description: message, variant: 'destructive' });
          return { message: message, success: false };
      }
    }
  };
  
  const [authState, formAction] = useActionState(handleAuthAction, { message: '', success: false });

  return (
    <Card className="w-full">
      <CardContent className="space-y-4 pt-6">
        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">O</span>
            </div>
        </div>
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="tu@email.com" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" name="password" type="password" required />
            </div>
            <SubmitButton isSignup={isSignup} />
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button variant="link" type="button" onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </Button>
      </CardFooter>
    </Card>
  );
}
