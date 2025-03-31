// Firebase configuration and utility functions
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Replace with actual API key in production
  authDomain: "adaptiq-learning.firebaseapp.com",
  projectId: "adaptiq-learning",
  storageBucket: "adaptiq-learning.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefg1234567890"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Auth functions
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const registerUser = async (email, password, userData) => {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Add user data to Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      ...userData,
      email,
      createdAt: new Date().toISOString(),
    });
    
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// User data functions
export const getUserData = async (userId) => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, error: "User document does not exist" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateUserData = async (userId, userData) => {
  try {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, userData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Settings functions
export const saveUserSettings = async (userId, settings) => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Update existing user document with new settings
      await updateDoc(docRef, { settings });
    } else {
      // Create a new document if it doesn't exist
      await setDoc(docRef, { settings });
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserSettings = async (userId) => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().settings) {
      return { success: true, settings: docSnap.data().settings };
    } else {
      return { success: false, error: "Settings not found" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export { auth, db };