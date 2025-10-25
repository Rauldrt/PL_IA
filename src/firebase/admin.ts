import { initializeApp, getApp, getApps, App } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

// IMPORTANT: DO NOT MODIFY THIS FILE
export function initializeFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // Load the service account key from environment variables.
  // This is automatically set by Firebase App Hosting.
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  if (!serviceAccount) {
    // This will happen in local development.
    // You can either set the FIREBASE_SERVICE_ACCOUNT env var locally,
    // or rely on Application Default Credentials.
    console.warn(
      'FIREBASE_SERVICE_ACCOUNT environment variable not set. ' +
      'Using Application Default Credentials for local development.'
    );
    return initializeApp();
  }

  return initializeApp({
    credential: credential.cert(serviceAccount),
  });
}
