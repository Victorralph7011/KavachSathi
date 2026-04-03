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

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up a new user
  async function signup(email, password, fullName) {
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
    // Ensure session survives page refreshes
    await setPersistence(auth, browserLocalPersistence);
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Log out the current user
  function logout() {
    return signOut(auth);
  }

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
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
