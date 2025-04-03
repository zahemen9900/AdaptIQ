// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth"
import { collection, doc, getDoc, getFirestore, setDoc, updateDoc, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore";
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

// Assignment-related functions

/**
 * Save multiple assignments to Firestore for a specific user and week
 * @param {string} userId - The user ID
 * @param {Array} assignments - Array of assignment objects
 * @param {string} weekId - The week identifier (e.g., "2025-W14" for week 14 of 2025)
 * @returns {Promise} - Success status and details
 */
export const saveUserAssignments = async (userId, assignments, weekId) => {
  try {
    if (!userId) {
      return { success: false, error: "No user ID provided" };
    }
    
    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return { success: false, error: "No valid assignments provided" };
    }
    
    if (!weekId) {
      // Get current week if not specified
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const pastDaysOfYear = (now - startOfYear) / 86400000;
      const currentWeek = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
      weekId = `${now.getFullYear()}-W${currentWeek}`;
    }
    
    // Reference to the user's assignments collection
    const userAssignmentsRef = collection(db, "users", userId, "assignments");
    
    // First, check if assignments already exist for this week
    const weekQuery = query(userAssignmentsRef, where("weekId", "==", weekId));
    const existingAssignments = await getDocs(weekQuery);
    
    // If there are existing assignments for this week, delete them
    if (!existingAssignments.empty) {
      const deletePromises = [];
      existingAssignments.forEach(doc => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      await Promise.all(deletePromises);
      console.log(`Deleted ${deletePromises.length} existing assignments for week ${weekId}`);
    }
    
    // Save the new assignments
    const savePromises = assignments.map(assignment => {
      // Add weekId to each assignment
      const assignmentWithWeek = {
        ...assignment,
        weekId,
        userId,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      return addDoc(userAssignmentsRef, assignmentWithWeek);
    });
    
    // Wait for all assignments to be saved
    await Promise.all(savePromises);
    
    return { 
      success: true, 
      message: `${assignments.length} assignments saved for week ${weekId}`,
      weekId
    };
  } catch (error) {
    console.error("Error saving user assignments:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all assignments for a specific user and week
 * @param {string} userId - The user ID
 * @param {string} weekId - Optional week identifier (if not provided, returns current week)
 * @returns {Promise} - Success status and assignments array
 */
export const getUserAssignments = async (userId, weekId) => {
  try {
    if (!userId) {
      return { success: false, error: "No user ID provided" };
    }
    
    if (!weekId) {
      // Get current week if not specified
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const pastDaysOfYear = (now - startOfYear) / 86400000;
      const currentWeek = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
      weekId = `${now.getFullYear()}-W${currentWeek}`;
    }
    
    // Reference to the user's assignments collection
    const userAssignmentsRef = collection(db, "users", userId, "assignments");
    
    // Query assignments for the specified week
    const weekQuery = query(userAssignmentsRef, where("weekId", "==", weekId));
    const assignmentDocs = await getDocs(weekQuery);
    
    // If no assignments found, return empty array
    if (assignmentDocs.empty) {
      return { 
        success: true, 
        assignments: [],
        weekId,
        message: `No assignments found for week ${weekId}`
      };
    }
    
    // Map the documents to assignment objects
    const assignments = [];
    assignmentDocs.forEach(doc => {
      assignments.push({
        ...doc.data(),
        firestoreId: doc.id // Add the Firestore document ID for future updates
      });
    });
    
    return { 
      success: true, 
      assignments,
      weekId,
      count: assignments.length
    };
  } catch (error) {
    console.error("Error getting user assignments:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update a single assignment's status, submission, or feedback
 * @param {string} userId - The user ID
 * @param {string} assignmentId - The assignment's firestore ID
 * @param {object} updates - The fields to update
 * @returns {Promise} - Success status
 */
export const updateAssignment = async (userId, assignmentId, updates) => {
  try {
    if (!userId || !assignmentId) {
      return { success: false, error: "User ID and assignment ID are required" };
    }
    
    // Create an update object with only allowed fields
    const allowedFields = [
      'status', 
      'submission', 
      'feedback', 
      'grade',
      'completedDate',
      'priority'
    ];
    
    const validUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        validUpdates[key] = updates[key];
      }
    });
    
    // Add last updated timestamp
    validUpdates.lastUpdated = new Date().toISOString();
    
    // Update the assignment document
    const assignmentRef = doc(db, "users", userId, "assignments", assignmentId);
    await updateDoc(assignmentRef, validUpdates);
    
    return { 
      success: true, 
      message: "Assignment updated successfully" 
    };
  } catch (error) {
    console.error("Error updating assignment:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all assignments for a user (across all weeks)
 * @param {string} userId - The user ID
 * @returns {Promise} - Success status and assignments array
 */
export const getAllUserAssignments = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: "No user ID provided" };
    }
    
    // Reference to the user's assignments collection
    const userAssignmentsRef = collection(db, "users", userId, "assignments");
    
    // Get all assignments sorted by due date
    const assignmentDocs = await getDocs(userAssignmentsRef);
    
    // If no assignments found, return empty array
    if (assignmentDocs.empty) {
      return { 
        success: true, 
        assignments: [],
        message: "No assignments found"
      };
    }
    
    // Map the documents to assignment objects
    const assignments = [];
    assignmentDocs.forEach(doc => {
      assignments.push({
        ...doc.data(),
        firestoreId: doc.id
      });
    });
    
    // Sort by due date
    assignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    return { 
      success: true, 
      assignments,
      count: assignments.length
    };
  } catch (error) {
    console.error("Error getting all user assignments:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get the current week identifier in the format YYYY-WXX
 * @returns {string} - Week identifier (e.g., "2025-W14")
 */
export const getCurrentWeekId = () => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const pastDaysOfYear = (now - startOfYear) / 86400000;
  const currentWeek = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${currentWeek.toString().padStart(2, '0')}`;
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); 

export {auth, db}