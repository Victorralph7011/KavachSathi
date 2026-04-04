import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// Check if we are using the demo/fallback Firebase config
const IS_DEMO_MODE = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'demo-kavachsathi-key';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up a new user
  async function signup(email, password, fullName) {
    if (IS_DEMO_MODE) {
      const mockUser = { uid: 'demo-' + Date.now(), email, displayName: fullName };
      localStorage.setItem('kavach_demo_user', JSON.stringify(mockUser));
      setCurrentUser(mockUser);
      return { user: mockUser };
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // 1. Update Firebase Auth Profile
    await updateProfile(user, { displayName: fullName });
    
    // 2. Save to Firestore users collection
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      fullName: fullName,
      email: email,
      createdAt: new Date().toISOString(),
      role: 'operative' // optional parametric assignment
    });
    
    return userCredential;
  }

  // Log in an existing user
  async function login(email, password) {
    if (IS_DEMO_MODE) {
      // Mock login always succeeds in demo mode
      const stored = localStorage.getItem('kavach_demo_user');
      const mockUser = stored ? JSON.parse(stored) : { uid: 'demo-123', email, displayName: 'Demo User' };
      localStorage.setItem('kavach_demo_user', JSON.stringify(mockUser));
      setCurrentUser(mockUser);
      return { user: mockUser };
    }

    // Ensure session survives page refreshes
    await setPersistence(auth, browserLocalPersistence);
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Log out the current user
  function logout() {
    if (IS_DEMO_MODE) {
      localStorage.removeItem('kavach_demo_user');
      setCurrentUser(null);
      return Promise.resolve();
    }
    return signOut(auth);
  }

  // Monitor auth state changes
  useEffect(() => {
    if (IS_DEMO_MODE) {
      const stored = localStorage.getItem('kavach_demo_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
      setLoading(false);
      return () => {}; // No unsubscribe needed
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isLoading: loading,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
