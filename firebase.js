// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth"
import { doc, getDoc, getFirestore, setDoc, updateDoc } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD2G1jPO8vWKRN-vG1AMFjxJTKORr8VA0A",
  authDomain: "adapt-iq-2025.firebaseapp.com",
  projectId: "adapt-iq-2025",
  storageBucket: "adapt-iq-2025.firebasestorage.app",
  messagingSenderId: "165815544144",
  appId: "1:165815544144:web:eacc9766893da5ae41a455",
  measurementId: "G-DWEW2XKPBE"
};

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

export const updateUserData = async (userId, userData) => {
  try {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, userData);
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); 

export {auth, db}