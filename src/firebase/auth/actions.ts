'use server';

import { z } from 'zod';
import { getAuth, UserRecord } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/firebase/admin';
import { doc, setDoc, writeBatch } from 'firebase-admin/firestore';
import { getFirestore } from 'firebase-admin/firestore';


const schema = z.object({
  email: z.string().email({ message: 'El email no es válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

export async function signup(
  prevState: { message: string; success: boolean, userRecord?: UserRecord },
  formData: FormData
): Promise<{ message: string; success: boolean, userRecord?: UserRecord }> {
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
  const app = initializeFirebaseAdmin();
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  let userRecord: UserRecord;
  try {
    userRecord = await auth.createUser({
      email,
      password,
    });
  } catch (error: any) {
    let message = 'Ocurrió un error inesperado durante el registro.';
    if (error.code === 'auth/email-already-exists') {
      message = 'Este email ya está registrado. Por favor, intenta iniciar sesión.';
    } else if (error.code === 'auth/invalid-password') {
        message = 'La contraseña no es válida. Debe tener al menos 6 caracteres.';
    }
    return { message, success: false };
  }

  // Create user profile and admin role in a batch write
  const batch = writeBatch(firestore);

  const userDocRef = doc(firestore, 'users', userRecord.uid);
  const userData = {
      email: userRecord.email,
      createdAt: new Date().toISOString(),
  };
  batch.set(userDocRef, userData);

  const adminRoleRef = doc(firestore, 'roles_admin', userRecord.uid);
  const adminData = {
    isAdmin: true,
    assignedAt: new Date().toISOString(),
  };
  batch.set(adminRoleRef, adminData);


  try {
    await batch.commit();
    return { message: 'Usuario creado con éxito y asignado como administrador.', success: true, userRecord };
  } catch (error: any) {
    console.error('Firestore batch commit error:', error);
    let message = 'No se pudo crear el perfil y rol del usuario en la base de datos. ';
    if (error.code === 'permission-denied') {
        message += 'Verifica las reglas de seguridad de Firestore.';
    } else {
        message += 'Error inesperado en la base de datos.';
    }
    // We should also delete the user from Auth to avoid a dangling account
    await auth.deleteUser(userRecord.uid);
    return { message, success: false };
  }
}


export async function login(
  prevState: { message: string; success: boolean },
  formData: FormData
): Promise<{ message:string; success: boolean }> {
  // This is a placeholder. The actual login logic is handled on the client in LoginForm.tsx
  // to correctly manage the auth state.
  return {
      message: 'El inicio de sesión se maneja en el cliente.',
      success: true 
  };
}
