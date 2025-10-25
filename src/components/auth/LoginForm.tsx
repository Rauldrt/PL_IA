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

  const handleLogin = async (prevState: any, formData: FormData) => {
    const result = await login(prevState, formData);
    if (result.success) {
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      try {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Éxito', description: 'Inicio de sesión exitoso.' });
        router.push('/chat');
      } catch (error) {
        toast({ title: 'Error de inicio de sesión', description: 'Email o contraseña incorrectos.', variant: 'destructive' });
      }
    } else if (result.message) {
      toast({ title: 'Error de inicio de sesión', description: result.message, variant: 'destructive' });
    }
    return result;
  };
  
  const handleSignup = async (prevState: any, formData: FormData) => {
    const result = await signup(prevState, formData);
    if (result.success) {
      toast({ title: 'Éxito', description: 'Cuenta creada. Ahora puedes iniciar sesión.' });
      setIsSignup(false);
    } else if (result.message) {
      toast({ title: 'Error de registro', description: result.message, variant: 'destructive' });
    }
    return result;
  };

  const [loginState, loginAction] = useActionState(handleLogin, { message: '', success: false });
  const [signupState, signupAction] = useActionState(handleSignup, { message: '', success: false });

  return (
    <Card className="w-full">
      <form action={isSignup ? signupAction : loginAction}>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="tu@email.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <SubmitButton isSignup={isSignup} />
          <Button variant="link" type="button" onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
