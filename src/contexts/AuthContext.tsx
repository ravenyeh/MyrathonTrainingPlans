'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, UserAbility, UserAvailability } from '@/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserData: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Firebase is not configured, stop loading
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser && db) {
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as User);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not configured');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    if (!auth || !db) throw new Error('Firebase not configured');

    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(newUser, { displayName });

    const defaultAbility: UserAbility = {
      weeklyMileage: 0,
      runningAge: 0,
    };

    const defaultAvailability: UserAvailability = {
      daysPerWeek: 4,
      hoursPerSession: 1,
      preferredTime: 'flexible',
    };

    const userDocData: Omit<User, 'id'> & { id: string } = {
      id: newUser.uid,
      email: newUser.email!,
      displayName,
      createdAt: serverTimestamp() as unknown as Timestamp,
      ability: defaultAbility,
      availability: defaultAvailability,
    };

    await setDoc(doc(db, 'users', newUser.uid), userDocData);
    setUserData(userDocData as unknown as User);
  };

  const signInWithGoogle = async () => {
    if (!auth || !db) throw new Error('Firebase not configured');

    const provider = new GoogleAuthProvider();
    const { user: googleUser } = await signInWithPopup(auth, provider);

    const userDoc = await getDoc(doc(db, 'users', googleUser.uid));

    if (!userDoc.exists()) {
      const defaultAbility: UserAbility = {
        weeklyMileage: 0,
        runningAge: 0,
      };

      const defaultAvailability: UserAvailability = {
        daysPerWeek: 4,
        hoursPerSession: 1,
        preferredTime: 'flexible',
      };

      const userDocData = {
        id: googleUser.uid,
        email: googleUser.email!,
        displayName: googleUser.displayName || 'User',
        createdAt: serverTimestamp(),
        ability: defaultAbility,
        availability: defaultAvailability,
      };

      await setDoc(doc(db, 'users', googleUser.uid), userDocData);
      setUserData(userDocData as unknown as User);
    } else {
      setUserData(userDoc.data() as User);
    }
  };

  const signOut = async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
    setUserData(null);
  };

  const updateUserData = async (data: Partial<User>) => {
    if (!user || !db) return;

    await setDoc(doc(db, 'users', user.uid), data, { merge: true });
    setUserData((prev) => prev ? { ...prev, ...data } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
