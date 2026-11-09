import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth & Google Auth Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore using the provisioned database ID
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

// Error Handling & ABAC Diagnostic Helpers
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test initial connection to Firestore
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

// Designated store owner accounts (defaults to the registered store administrator)
export const DEFAULT_OWNER_EMAILS = [
  'sunilchain@gmail.com',
  'support@bharatvarshcrafts.com'
];

export function isOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  const configuredOwner = (import.meta as any).env?.VITE_STORE_OWNER_EMAIL?.toLowerCase();
  if (configuredOwner && cleanEmail === configuredOwner) {
    return true;
  }
  return DEFAULT_OWNER_EMAILS.includes(cleanEmail);
}

// Ensure user profile document exists in Firestore on sign-in and assign role
export async function syncUserProfile(user: FirebaseUser): Promise<{ role: 'Owner' | 'Customer' }> {
  if (!user || !user.uid) return { role: 'Customer' };
  const userRef = doc(db, 'users', user.uid);
  
  // Designate Owner if email matches, otherwise default to Customer
  const isOwner = isOwnerEmail(user.email);
  const assignedRole: 'Owner' | 'Customer' = isOwner ? 'Owner' : 'Customer';

  try {
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Patron',
        photoURL: user.photoURL || '',
        role: assignedRole,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    // Non-blocking sync log
    console.warn('Could not sync user profile to Firestore:', err);
  }

  return { role: assignedRole };
}

export {
  signInWithPopup,
  firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  type FirebaseUser
};
