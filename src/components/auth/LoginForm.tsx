'use client';

import React, { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login, signup, handleGoogleSignIn } from '@/firebase/auth/actions';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

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

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
<path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.012,36.426,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);


export default function LoginForm() {
  const [isSignup, setIsSignup] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

  const onGoogleSignIn = async () => {
    if (!auth) {
      toast({ title: 'Error', description: 'Servicio de autenticación no disponible.', variant: 'destructive' });
      return;
    }
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Call server action to create user profile in Firestore
      const serverResult = await handleGoogleSignIn(user.uid, user.email || '');
      if (serverResult.success) {
        toast({ title: 'Éxito', description: 'Inicio de sesión con Google exitoso.' });
        router.push('/chat');
      } else {
        toast({ title: 'Error del Servidor', description: serverResult.message, variant: 'destructive' });
        await user.delete(); // Clean up user if server logic fails
      }
    } catch (error: any) {
      let message = 'No se pudo iniciar sesión con Google.';
      if (error.code === 'auth/account-exists-with-different-credential') {
        message = 'Ya existe una cuenta con este email pero con un método de inicio de sesión diferente.';
      }
      toast({ title: 'Error de Google', description: message, variant: 'destructive' });
    } finally {
        setIsGoogleLoading(false);
    }
  };


  return (
    <Card className="w-full">
      <CardContent className="space-y-4 pt-6">
        <Button variant="outline" className="w-full" onClick={onGoogleSignIn} disabled={isGoogleLoading}>
            {isGoogleLoading ? (
                <LoaderCircle className="animate-spin" />
            ) : (
                <>
                    <GoogleIcon className="mr-2" />
                    Continuar con Google
                </>
            )}
        </Button>
        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">O continuar con</span>
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
