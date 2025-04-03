// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth"
import { collection, doc, getDoc, getFirestore, setDoc, updateDoc } from "firebase/firestore";
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

// User settings functions
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

// Update user data in Firestore
export const updateUserData = async (userId, userData) => {
  try {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, userData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get user settings from Firestore
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

// Get user data from Firestore
export const getUserData = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: "No user ID provided" };
    }
    
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, userData: docSnap.data() };
    } else {
      return { success: false, error: "User data not found" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Schedule-related functions

// Save user's learning schedule to Firestore
export const saveUserSchedule = async (userId, schedule) => {
  try {
    if (!userId) {
      return { success: false, error: "No user ID provided" };
    }
    
    const docRef = doc(db, "users", userId);
    const userDoc = await getDoc(docRef);
    
    if (userDoc.exists()) {
      // Update the existing user document with the schedule data
      await updateDoc(docRef, { 
        schedule: schedule,
        scheduleLastUpdated: new Date().toISOString()
      });
    } else {
      // Create a new user document with the schedule
      await setDoc(docRef, { 
        schedule: schedule,
        scheduleLastUpdated: new Date().toISOString()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error saving user schedule:", error);
    return { success: false, error: error.message };
  }
};

// Get user's learning schedule from Firestore
export const getUserSchedule = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: "No user ID provided" };
    }
    
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().schedule) {
      return { 
        success: true, 
        schedule: docSnap.data().schedule,
        lastUpdated: docSnap.data().scheduleLastUpdated || null
      };
    } else {
      return { success: false, error: "Schedule not found" };
    }
  } catch (error) {
    console.error("Error fetching user schedule:", error);
    return { success: false, error: error.message };
  }
};

// Get user's learning preferences for schedule generation
export const getUserLearningPreferences = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: "No user ID provided" };
    }
    
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const userData = docSnap.data();
      
      // Extract relevant schedule preferences
      const learningPrefs = {
        learningStyle: userData.learningStyle || '',
        studyEnvironment: userData.studyEnvironment || '',
        preferredTime: userData.preferredTime || '',
        subjects: userData.subjects || [],
        courses: userData.courses || [],
        customCourses: userData.customCourses || {},
        availableDays: userData.availableDays || [],
        studyDuration: userData.studyDuration || '',
        breakFrequency: userData.breakFrequency || '',
        schedulingStyle: userData.schedulingStyle || '',
      };
      
      return { success: true, preferences: learningPrefs };
    } else {
      return { success: false, error: "User learning preferences not found" };
    }
  } catch (error) {
    console.error("Error fetching user learning preferences:", error);
    return { success: false, error: error.message };
  }
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); 

export {auth, db}