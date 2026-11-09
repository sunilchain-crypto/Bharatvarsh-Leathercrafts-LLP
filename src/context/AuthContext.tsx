import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  syncUserProfile,
  isOwnerEmail,
  testFirestoreConnection,
  type FirebaseUser
} from '../lib/firebase';
import { UserRole } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  role: UserRole;
  isOwner: boolean;
  isCustomer: boolean;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  getIdToken: () => Promise<string | null>;
  getAuthHeaders: () => Promise<Record<string, string>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<UserRole>('Customer');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const determineRole = (u: FirebaseUser | null): UserRole => {
    if (!u || !u.email) return 'Customer';
    return isOwnerEmail(u.email) ? 'Owner' : 'Customer';
  };

  useEffect(() => {
    // Validate Firestore connectivity
    testFirestoreConnection();

    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const computedRole = determineRole(currentUser);
        setRole(computedRole);
        try {
          const synced = await syncUserProfile(currentUser);
          if (synced?.role) {
            setRole(synced.role);
          }
        } catch (e) {
          console.warn('[Auth] Role sync fallback to computed:', e);
        }
      } else {
        setRole('Customer');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getIdToken = async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    try {
      return await auth.currentUser.getIdToken();
    } catch {
      return null;
    }
  };

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const token = await getIdToken();
    if (token) {
      return {
        'Authorization': `Bearer ${token}`
      };
    }
    return {};
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        const synced = await syncUserProfile(res.user);
        setRole(synced.role);
      }
    } catch (err: any) {
      console.error('Firebase Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before finishing.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Sign-in popup was blocked by your browser. Please allow popups.');
      } else {
        setError(err.message || 'Google Sign-in failed. Please try again.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      setError(null);
      setLoading(true);
      const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
      if (res.user) {
        const synced = await syncUserProfile(res.user);
        setRole(synced.role);
      }
    } catch (err: any) {
      console.error('Firebase Email Sign-In Error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Failed to sign in.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    try {
      setError(null);
      setLoading(true);
      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (res.user) {
        if (name && name.trim()) {
          await updateProfile(res.user, { displayName: name.trim() });
        }
        // New users default to Customer unless they match the designated Owner email
        const synced = await syncUserProfile(res.user);
        setRole(synced.role);
      }
    } catch (err: any) {
      console.error('Firebase Email Sign-Up Error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Registration failed.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      setRole('Customer');
    } catch (err: any) {
      console.error('Firebase Logout Error:', err);
      setError(err.message || 'Failed to sign out.');
    }
  };

  const clearError = () => setError(null);

  const isOwner = role === 'Owner';
  const isCustomer = !isOwner;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isOwner,
        isCustomer,
        loading,
        error,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        clearError,
        getIdToken,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
