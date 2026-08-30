import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, getDocs, query, collection, where, setDoc, deleteDoc, serverTimestamp } from '@/src/lib/firebase';
import { auth, db } from './firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  wishlist: string[];
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  wishlist: []
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (!authUser) {
        setProfile(null);
        setWishlist([]);
        setLoading(false);
      }
    });

    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const userEmail = user.email ? user.email.trim().toLowerCase() : '';

    // Listen to user profile changes including wishlist
    const unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        let data = docSnap.data() as UserProfile;
        
        // If role is customer, check if an admin created a staff/supplier/agent account with this email
        if ((!data.role || data.role === 'customer') && userEmail) {
          try {
            const q = query(collection(db, 'users'), where('email', '==', user.email));
            const existingSnaps = await getDocs(q);
            const staffDoc = existingSnaps.docs.find(d => d.id !== user.uid && ['admin', 'staff', 'supplier', 'agent', 'superadmin'].includes(d.data()?.role));
            if (staffDoc) {
              const staffData = staffDoc.data();
              const merged = {
                ...staffData,
                uid: user.uid,
                email: user.email,
                displayName: data.displayName || staffData.displayName || user.displayName || 'Staff Member',
                updatedAt: serverTimestamp()
              };
              await setDoc(userRef, merged, { merge: true });
              data = { ...data, ...merged } as UserProfile;
              if (staffDoc.id.startsWith('usr_')) {
                try {
                  await deleteDoc(doc(db, 'users', staffDoc.id));
                } catch (_) {}
              }
            }
          } catch (mergeErr) {
            console.warn("[AuthContext] Staff profile merge check:", mergeErr);
          }
        }
        
        setProfile(data);
        setWishlist(data.wishlist || []);
      } else {
        // Document does not exist yet; check for existing staff placeholder by email
        if (userEmail) {
          try {
            const q = query(collection(db, 'users'), where('email', '==', user.email));
            const existingSnaps = await getDocs(q);
            const staffDoc = existingSnaps.docs.find(d => ['admin', 'staff', 'supplier', 'agent', 'superadmin'].includes(d.data()?.role));
            if (staffDoc) {
              const staffData = staffDoc.data();
              const initial = {
                ...staffData,
                uid: user.uid,
                email: user.email,
                displayName: staffData.displayName || user.displayName || user.email?.split('@')[0] || 'Staff Member',
                photoURL: user.photoURL || staffData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'U')}&background=0D9488&color=fff`,
                role: staffData.role,
                status: staffData.status || 'active',
                createdAt: staffData.createdAt || serverTimestamp(),
                updatedAt: serverTimestamp()
              };
              await setDoc(userRef, initial);
              setProfile(initial as UserProfile);
              if (staffDoc.id.startsWith('usr_')) {
                try {
                  await deleteDoc(doc(db, 'users', staffDoc.id));
                } catch (_) {}
              }
            }
          } catch (initErr) {
            console.warn("[AuthContext] Staff profile init check:", initErr);
          }
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("AuthContext profile error:", error);
      setLoading(false);
    });

    return unsubscribeProfile;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, wishlist }}>
      {children}
    </AuthContext.Provider>
  );
};

