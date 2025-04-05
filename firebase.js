// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth"
import { collection, doc, getDoc, getFirestore, setDoc, updateDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD2G1jPO8vWKRN-vG1AMFjxJTKORr8VA0A",
  authDomain: "adapt-iq-2025.firebaseapp.com",
  projectId: "adapt-iq-2025",
  storageBucket: "adapt-iq-2025.appspot.com", // Updated storage bucket format
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
      await setDoc(docRef, { 
        settings,
        profilePictureURL: null, // Initialize profile picture as null
        createdAt: serverTimestamp(),
        lastUpdatedAt: serverTimestamp()
      });
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

// Streak-related functions

// Update user's study streak
export const updateUserStreak = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: "No user ID provided" };
    }
    
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const userData = docSnap.data();
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day
      const todayStr = today.toISOString().split('T')[0];
      
      // Get the last active date or set to null if it doesn't exist
      const lastActiveDate = userData.lastActiveDate ? new Date(userData.lastActiveDate) : null;
      let currentStreak = userData.studyStreak || 0;
      let highestStreak = userData.highestStudyStreak || 0;
      
      // If this is the first activity, start streak at 1
      if (!lastActiveDate) {
        currentStreak = 1;
      } else {
        // Check if the last active date was yesterday
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        
        const lastActiveDateNormalized = new Date(lastActiveDate);
        lastActiveDateNormalized.setHours(0, 0, 0, 0);
        
        // If already marked active today, don't increment
        if (lastActiveDateNormalized.getTime() === today.getTime()) {
          // Already logged today, no streak update needed
        }
        // If active yesterday, increment streak
        else if (lastActiveDateNormalized.getTime() === yesterday.getTime()) {
          currentStreak += 1;
        } 
        // If missed a day or more, reset streak to 1
        else {
          currentStreak = 1;
        }
      }
      
      // Update highest streak if current streak is higher
      if (currentStreak > highestStreak) {
        highestStreak = currentStreak;
      }
      
      // Update user data with new streak info
      await updateDoc(docRef, {
        lastActiveDate: todayStr,
        studyStreak: currentStreak,
        highestStudyStreak: highestStreak,
        lastUpdatedAt: serverTimestamp()
      });
      
      return { 
        success: true, 
        currentStreak: currentStreak,
        highestStreak: highestStreak
      };
    } else {
      // Create user document with initial streak of 1
      await setDoc(docRef, {
        lastActiveDate: new Date().toISOString().split('T')[0],
        studyStreak: 1,
        highestStudyStreak: 1,
        profilePictureURL: null, // Initialize profile picture as null
        createdAt: serverTimestamp(),
        lastUpdatedAt: serverTimestamp()
      });
      
      return { 
        success: true, 
        currentStreak: 1,
        highestStreak: 1
      };
    }
  } catch (error) {
    console.error("Error updating user streak:", error);
    return { success: false, error: error.message };
  }
};

// Get user's current streak information
export const getUserStreakInfo = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: "No user ID provided" };
    }
    
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const userData = docSnap.data();
      
      return { 
        success: true, 
        currentStreak: userData.studyStreak || 0,
        highestStreak: userData.highestStudyStreak || 0,
        lastActiveDate: userData.lastActiveDate || null
      };
    } else {
      return { success: false, error: "User not found" };
    }
  } catch (error) {
    console.error("Error getting user streak info:", error);
    return { success: false, error: error.message };
  }
};

// Profile picture functions

// Upload a profile picture for user
export const uploadProfilePicture = async (userId, file) => {
  try {
    if (!userId) {
      return { success: false, error: "No user ID provided" };
    }
    
    if (!file) {
      return { success: false, error: "No file provided" };
    }
    
    // Initialize storage
    const storage = getStorage();
    
    // Create a storage reference
    const storageRef = ref(storage, `profile-pictures/${userId}`);
    
    // Upload file
    await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    // Update user document with profile picture URL
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      profilePictureURL: downloadURL,
      profilePictureUpdatedAt: serverTimestamp()
    });
    
    return { success: true, profilePictureURL: downloadURL };
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    return { success: false, error: error.message };
  }
};

// Upload a profile picture from data URL (base64)
export const uploadProfilePictureFromDataURL = async (userId, dataURL) => {
  try {
    if (!userId) {
      console.error("Upload failed: No user ID provided");
      return { success: false, error: "No user ID provided" };
    }
    
    if (!dataURL) {
      console.error("Upload failed: No data URL provided");
      return { success: false, error: "No data URL provided" };
    }
    
    // Validate data URL format
    if (!dataURL.startsWith('data:image/')) {
      console.error("Upload failed: Invalid data URL format");
      return { success: false, error: "Invalid data URL format. Must be an image." };
    }
    
    console.log(`Starting profile picture upload for user ${userId}`);
    
    let blob;
    try {
      // Convert data URL to Blob
      const response = await fetch(dataURL);
      blob = await response.blob();
      console.log("Successfully converted data URL to blob:", blob.type, blob.size, "bytes");
    } catch (blobError) {
      console.error("Failed to convert data URL to blob:", blobError);
      return { success: false, error: `Failed to process image: ${blobError.message}` };
    }
    
    // Check if the blob is valid
    if (!blob || blob.size === 0) {
      console.error("Upload failed: Invalid or empty blob");
      return { success: false, error: "Failed to process image: Empty or invalid data" };
    }
    
    // Initialize storage reference
    const storage = getStorage();
    const storageRef = ref(storage, `profile-pictures/${userId}`);
    
    try {
      // Upload file and report progress
      console.log("Starting upload to Firebase Storage...");
      await uploadBytes(storageRef, blob);
      console.log("Upload to Firebase Storage complete");
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      console.log("Retrieved download URL:", downloadURL.substring(0, 50) + "...");
      
      // Update user document in Firestore
      console.log("Updating user document with new profile picture URL...");
      const userRef = doc(db, "users", userId);
      
      // First ensure the user document exists with the profilePictureURL field
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        // If document exists, update it
        await updateDoc(userRef, {
          profilePictureURL: downloadURL,
          profilePictureUpdatedAt: serverTimestamp()
        });
      } else {
        // If document doesn't exist, create it with necessary fields
        await setDoc(userRef, {
          profilePictureURL: downloadURL,
          profilePictureUpdatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      }
      
      console.log("Profile picture update complete");
      return { success: true, profilePictureURL: downloadURL };
    } catch (uploadError) {
      console.error("Error during Firebase upload or update:", uploadError);
      return { success: false, error: `Firebase upload failed: ${uploadError.message}` };
    }
  } catch (error) {
    console.error("Error uploading profile picture from data URL:", error);
    return { success: false, error: error.message || "Unknown error occurred" };
  }
};

// Get user's profile picture URL
export const getProfilePictureURL = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: "No user ID provided" };
    }
    
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().profilePictureURL) {
      return { 
        success: true, 
        profilePictureURL: docSnap.data().profilePictureURL 
      };
    } else {
      return { success: false, error: "Profile picture not found" };
    }
  } catch (error) {
    console.error("Error getting profile picture URL:", error);
    return { success: false, error: error.message };
  }
};

// Get count of completed assignments
export const getCompletedAssignmentsCount = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: "No user ID provided" };
    }
    
    const assignmentsCollection = collection(db, "users", userId, "assignments");
    const assignmentDocs = await getDocs(assignmentsCollection);
    
    let completedCount = 0;
    assignmentDocs.forEach(doc => {
      const assignment = doc.data();
      if (assignment.status === 'completed') {
        completedCount++;
      }
    });
    
    return { success: true, completedCount };
  } catch (error) {
    console.error("Error getting completed assignments count:", error);
    return { success: false, error: error.message, completedCount: 0 };
  }
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export {auth, db, storage}