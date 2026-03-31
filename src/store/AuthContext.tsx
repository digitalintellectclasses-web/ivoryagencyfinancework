'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser,
  getIdTokenResult
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, serverTimestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'employee';

export type AppUser = {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
  email: string;
};

type AuthContextType = {
  users: AppUser[];
  currentUser: AppUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createEmployee: (username: string, email: string, password: string, displayName: string) => Promise<void>;
  isAuthenticated: boolean;
  isLoaded: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser({
                id: user.uid,
                username: userData.username || user.email?.split('@')[0],
                role: userData.role as UserRole,
                displayName: userData.displayName || user.displayName || 'User',
                email: user.email || '',
            });
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoaded(true);
    });

    // Subscriptions for user list (only if admin)
    // For simplicity, we'll listen to the users collection if any user is logged in for now, 
    // but in a production app, security rules should restrict this to admins.
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AppUser)));
    });

    return () => {
        unsubscribeAuth();
        unsubscribeUsers();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Login failed:", error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.setItem('ag_isAdmin', 'false');
    } catch (error: any) {
      console.error("Logout failed:", error.message);
      throw error;
    }
  };

  const createEmployee = async (username: string, email: string, password: string, displayName: string) => {
    // Note: This often requires Firebase Admin SDK or a Cloud Function to create users without logging out
    // But for a simple implementation, we can create the profile in Firestore 
    // and the user will have to sign up separately OR use an admin-only creation flow.
    // For now, we'll assume the admin is adding the profile to Firestore.
    try {
        const userId = `usr_${Date.now()}`; // Placeholder until real Auth integration
        await setDoc(doc(db, 'users', userId), {
            username: username.toUpperCase(),
            displayName,
            role: 'employee',
            email: email.toLowerCase(),
            createdAt: serverTimestamp()
        });
    } catch (error: any) {
        console.error("Failed to create employee:", error.message);
        throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        users,
        currentUser,
        login,
        logout,
        createEmployee,
        isAuthenticated: currentUser !== null,
        isLoaded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
