'use server';

import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/firebase/admin';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase-admin/firestore';

const schema = z.object({
  email: z.string().email({ message: 'El email no es válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

export async function signup(
  prevState: { message: string; success: boolean },
  formData: FormData
): Promise<{ message: string; success: boolean }> {
  const validatedFields = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    const message = errors.email?.[0] || errors.password?.[0] || 'Datos inválidos.';
    return {
      message,
      success: false,
    };
  }

  const { email, password } = validatedFields.data;

  try {
    const app = initializeFirebaseAdmin();
    const auth = getAuth(app);
    const firestore = getFirestore(app);

    const userRecord = await auth.createUser({
      email,
      password,
    });
    
    // Create a user profile document in Firestore
    await setDoc(doc(firestore, 'users', userRecord.uid), {
        email: userRecord.email,
        createdAt: new Date().toISOString(),
    });

    return { message: 'Usuario creado con éxito.', success: true };

  } catch (error: any) {
    let message = 'Ocurrió un error inesperado durante el registro.';
    if (error.code === 'auth/email-already-exists') {
      message = 'Este email ya está registrado. Por favor, intenta iniciar sesión.';
    } else if (error.code === 'auth/invalid-password') {
        message = 'La contraseña no es válida. Debe tener al menos 6 caracteres.';
    }
    console.error('Firebase Admin Signup Error:', error.code, error.message);
    return { message, success: false };
  }
}

// Note: The login server action is not strictly necessary for client-side login,
// but can be useful for server-side checks if needed in the future.
// For now, we'll keep it simple and rely on the client-side `signInWithEmailAndPassword`.
export async function login(
  prevState: { message: string; success: boolean },
  formData: FormData
): Promise<{ message: string; success: boolean }> {
  // This is a placeholder. The actual login logic is handled on the client in LoginForm.tsx
  // to correctly manage the auth state.
  return {
      message: 'El inicio de sesión se maneja en el cliente.',
      success: true 
  };
}