'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '@/firebase/admin';
import { z } from 'zod';

const UserProfileSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
});

/**
 * Creates user profile documents in Firestore after successful client-side registration.
 * This is a secure server-side operation.
 */
export async function createUserProfile(input: { userId: string; email: string; }) {
  const validatedFields = UserProfileSchema.safeParse(input);

  if (!validatedFields.success) {
    throw new Error('Invalid user data provided.');
  }

  const { userId, email } = validatedFields.data;
  const app = initializeFirebaseAdmin();
  const firestore = getFirestore(app);
  const batch = firestore.batch();

  // 1. Create user profile document
  const userDocRef = firestore.collection('users').doc(userId);
  const userData = {
    email: email,
    createdAt: new Date().toISOString(),
  };
  batch.set(userDocRef, userData);

  // 2. Check if any other admins exist. If not, make this user an admin.
  const adminRolesCollection = firestore.collection('roles_admin');
  const adminSnapshot = await adminRolesCollection.limit(1).get();
  
  if (adminSnapshot.empty) {
    const adminRoleRef = adminRolesCollection.doc(userId);
    const adminData = {
      isAdmin: true,
      assignedAt: new Date().toISOString()
    };
    batch.set(adminRoleRef, adminData);
  }

  // Commit all changes to Firestore
  try {
    await batch.commit();
    return { success: true, message: 'User profile created successfully.' };
  } catch (error) {
    console.error('Error creating user profile in Firestore:', error);
    // In a real app, you might want to trigger a cleanup of the auth user 
    // if the Firestore transaction fails, but for now we log the error.
    throw new Error('Failed to save user profile to database.');
  }
}
