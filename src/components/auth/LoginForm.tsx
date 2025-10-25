'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login, signup } from '@/firebase/auth/actions';

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
  const [loginState, loginAction] = useFormState(login, { message: '', success: false });
  const [signupState, signupAction] = useFormState(signup, { message: '', success: false });
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    if (loginState.success) {
      toast({ title: 'Éxito', description: 'Inicio de sesión exitoso.' });
      router.push('/chat');
    } else if (loginState.message) {
      toast({ title: 'Error de inicio de sesión', description: loginState.message, variant: 'destructive' });
    }
  }, [loginState, router, toast]);

  React.useEffect(() => {
    if (signupState.success) {
      toast({ title: 'Éxito', description: 'Cuenta creada. Ahora puedes iniciar sesión.' });
      setIsSignup(false);
    } else if (signupState.message) {
      toast({ title: 'Error de registro', description: signupState.message, variant: 'destructive' });
    }
  }, [signupState, toast]);

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
