// Progress tracking utilities for AdaptIQ
import { auth, db } from '../../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';

/**
 * Get progress value from Firebase (or localStorage as fallback)
 * @param {string} courseName - The name of the course
 * @returns {Promise<number>} - The progress value (0-100)
 */
export const getProgressFromFirebase = async (courseName) => {
  try {
    // Return 0 if not authenticated
    if (!auth.currentUser) {
      console.warn("No user signed in, using localStorage fallback");
      return getProgressFromLocalStorage(courseName);
    }
    
    const userId = auth.currentUser.uid;
    const courseId = courseName.toLowerCase().replace(/ /g, '-');
    
    // Get user's course data
    const courseRef = doc(db, "users", userId, "courses", courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (courseDoc.exists() && courseDoc.data().progress !== undefined) {
      return courseDoc.data().progress;
    }
    
    // If no record in Firebase, check localStorage as fallback
    const localProgress = getProgressFromLocalStorage(courseName);
    
    // If there's local progress data, sync it to Firebase
    if (localProgress > 0) {
      await setDoc(courseRef, {
        courseName,
        courseId, 
        progress: localProgress,
        lastUpdated: serverTimestamp()
      }, { merge: true });
    } else {
      // Initialize progress for this course
      await setDoc(courseRef, {
        courseName,
        courseId,
        progress: 0,
        lastUpdated: serverTimestamp()
      }, { merge: true });
    }
    
    return localProgress;
  } catch (error) {
    console.error("Error fetching progress from Firebase:", error);
    return getProgressFromLocalStorage(courseName);
  }
};

/**
 * Get progress from localStorage
 * @param {string} courseName - The name of the course
 * @returns {number} - The progress value
 */
const getProgressFromLocalStorage = (courseName) => {
  try {
    const progressKey = `course-progress-${courseName.toLowerCase().replace(/ /g, '-')}`;
    const storedProgress = localStorage.getItem(progressKey);
    return storedProgress ? parseInt(storedProgress, 10) : 0;
  } catch (error) {
    console.error("Error fetching progress from localStorage:", error);
    return 0;
  }
};

/**
 * Update progress value in Firebase (or localStorage as fallback)
 * @param {string} courseName - The name of the course
 * @param {number} newProgress - The new progress value (0-100)
 * @returns {Promise<number>} - The updated progress value
 */
export const updateProgressInFirebase = async (courseName, newProgress) => {
  try {
    // Ensure progress is within valid range
    const clampedProgress = Math.min(100, Math.max(0, newProgress));
    
    // Always update localStorage for fallback
    const progressKey = `course-progress-${courseName.toLowerCase().replace(/ /g, '-')}`;
    localStorage.setItem(progressKey, clampedProgress.toString());
    
    // If user is authenticated, update Firebase
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      const courseId = courseName.toLowerCase().replace(/ /g, '-');
      
      // Get user's course data
      const courseRef = doc(db, "users", userId, "courses", courseId);
      const courseDoc = await getDoc(courseRef);
      
      if (courseDoc.exists()) {
        // Update existing document
        await updateDoc(courseRef, {
          progress: clampedProgress,
          lastUpdated: serverTimestamp()
        });
      } else {
        // Create new document
        await setDoc(courseRef, {
          courseName,
          courseId,
          progress: clampedProgress,
          lastUpdated: serverTimestamp()
        });
      }
    }
    
    return clampedProgress;
  } catch (error) {
    console.error("Error updating progress in Firebase:", error);
    return newProgress;
  }
};

/**
 * Increment progress value for a course
 * @param {string} courseName - The name of the course
 * @param {number} increment - The amount to increment (default: 5)
 * @returns {Promise<number>} - The updated progress value
 */
export const incrementProgress = async (courseName, increment = 5) => {
  try {
    // Get current progress
    const currentProgress = await getProgressFromFirebase(courseName);
    
    // Calculate new progress, ensuring it doesn't exceed 100%
    const newProgress = Math.min(100, currentProgress + increment);
    
    // Update progress in storage
    return await updateProgressInFirebase(courseName, newProgress);
  } catch (error) {
    console.error("Error incrementing progress:", error);
    return 0;
  }
};

/**
 * Get activity history for a course
 * @param {string} courseName - The name of the course
 * @param {number} maxItems - Maximum number of activities to return (default: 50)
 * @returns {Promise<Array>} - Array of activity objects
 */
export const getActivityHistory = async (courseName, maxItems = 50) => {
  try {
    // If not authenticated, fall back to localStorage
    if (!auth.currentUser) {
      console.warn("No user signed in, using localStorage fallback");
      return getActivityHistoryFromLocalStorage(courseName);
    }
    
    const userId = auth.currentUser.uid;
    const courseId = courseName.toLowerCase().replace(/ /g, '-');
    
    // Query Firestore for activity history
    const activitiesRef = collection(db, "users", userId, "activities");
    const activitiesQuery = query(
      activitiesRef,
      where("courseId", "==", courseId),
      orderBy("timestamp", "desc"),
      limit(maxItems)
    );
    
    const querySnapshot = await getDocs(activitiesQuery);
    
    // Convert query results to array
    const activities = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      activities.push({
        id: doc.id,
        type: data.type,
        name: data.name,
        date: data.timestamp ? data.timestamp.toDate() : new Date(),
        score: data.score || null
      });
    });
    
    if (activities.length === 0) {
      // If no activities in Firestore, check localStorage
      const localActivities = getActivityHistoryFromLocalStorage(courseName);
      
      // If local activities exist, sync them to Firebase
      if (localActivities.length > 0) {
        for (const activity of localActivities) {
          await recordActivity(courseName, {
            type: activity.type,
            name: activity.name,
            score: activity.score
          });
        }
        
        return localActivities;
      }
    }
    
    return activities;
  } catch (error) {
    console.error("Error fetching activity history from Firebase:", error);
    return getActivityHistoryFromLocalStorage(courseName);
  }
};

/**
 * Get activity history from localStorage
 * @param {string} courseName - The name of the course
 * @returns {Array} - Array of activity objects
 */
const getActivityHistoryFromLocalStorage = (courseName) => {
  try {
    const activityKey = `course-activity-${courseName.toLowerCase().replace(/ /g, '-')}`;
    const storedActivity = localStorage.getItem(activityKey);
    
    // Parse stored activity data
    const activityData = storedActivity ? JSON.parse(storedActivity) : [];
    
    // If there's no activity data, return an empty array
    if (!activityData || !Array.isArray(activityData) || activityData.length === 0) {
      return [];
    }
    
    return activityData;
  } catch (error) {
    console.error("Error fetching activity history from localStorage:", error);
    return [];
  }
};

/**
 * Record a learning activity for a course
 * @param {string} courseName - The name of the course
 * @param {Object} activity - The activity object with type, name, and optional score
 * @returns {Promise<Object>} - The recorded activity object
 */
export const recordActivity = async (courseName, activity) => {
  try {
    // Extract activity properties or use defaults
    const { type, name, score } = activity;
    
    // Create new activity object
    const newActivity = {
      id: Date.now(),
      type: type || 'generic',
      name: name || `${type} Activity`,
      date: new Date(),
      score: score || null
    };
    
    // Always save to localStorage as fallback
    saveActivityToLocalStorage(courseName, newActivity);
    
    // If user is authenticated, save to Firebase
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      const courseId = courseName.toLowerCase().replace(/ /g, '-');
      
      // Create activity document for Firestore
      const activityData = {
        userId,
        courseId,
        courseName,
        type: newActivity.type,
        name: newActivity.name,
        score: newActivity.score,
        timestamp: Timestamp.fromDate(new Date())
      };
      
      // Add to activities collection
      const activitiesRef = collection(db, "users", userId, "activities");
      await addDoc(activitiesRef, activityData);
      
      // Update course document with latest activity
      const courseRef = doc(db, "users", userId, "courses", courseId);
      await updateDoc(courseRef, {
        lastActivityType: newActivity.type,
        lastActivityDate: serverTimestamp(),
      }, { merge: true });
    }
    
    // Increment progress based on activity type
    let progressIncrement = 0;
    
    switch (type) {
      case 'quiz':
        // Quiz contributes more to progress
        progressIncrement = 5;
        break;
      case 'chat':
        // Chat contributes moderately to progress
        progressIncrement = 3;
        break;
      case 'resources':
        // Resource study contributes slightly to progress
        progressIncrement = 3;
        break;
      default:
        progressIncrement = 2;
    }
    
    // Increment course progress
    await incrementProgress(courseName, progressIncrement);
    
    return newActivity;
  } catch (error) {
    console.error("Error recording activity in Firebase:", error);
    return null;
  }
};

/**
 * Save activity to localStorage
 * @param {string} courseName - The name of the course
 * @param {Object} activity - The activity object
 */
const saveActivityToLocalStorage = (courseName, activity) => {
  try {
    const activityKey = `course-activity-${courseName.toLowerCase().replace(/ /g, '-')}`;
    const activityHistory = JSON.parse(localStorage.getItem(activityKey) || '[]');
    
    // Add to the beginning of the array
    activityHistory.unshift(activity);
    
    // Keep only the latest 50 activities
    if (activityHistory.length > 50) {
      activityHistory.length = 50;
    }
    
    // Save to localStorage
    localStorage.setItem(activityKey, JSON.stringify(activityHistory));
  } catch (error) {
    console.error("Error saving activity to localStorage:", error);
  }
};

/**
 * Reset progress for a course
 * @param {string} courseName - The name of the course
 * @returns {Promise<boolean>} - Success status
 */
export const resetProgress = async (courseName) => {
  try {
    // Reset progress in localStorage
    const progressKey = `course-progress-${courseName.toLowerCase().replace(/ /g, '-')}`;
    localStorage.removeItem(progressKey);
    
    // Clear activity history in localStorage
    const activityKey = `course-activity-${courseName.toLowerCase().replace(/ /g, '-')}`;
    localStorage.removeItem(activityKey);
    
    // If user is authenticated, reset in Firebase
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      const courseId = courseName.toLowerCase().replace(/ /g, '-');
      
      // Reset progress in course document
      const courseRef = doc(db, "users", userId, "courses", courseId);
      await updateDoc(courseRef, {
        progress: 0,
        lastReset: serverTimestamp()
      });
      
      // Note: We don't delete activity history in Firebase, just reset progress
    }
    
    return true;
  } catch (error) {
    console.error("Error resetting progress:", error);
    return false;
  }
};

/**
 * Get overall progress for all courses
 * @returns {Promise<Object>} - Object with course names as keys and progress values as values
 */
export const getAllCoursesProgress = async () => {
  try {
    // If not authenticated, fall back to localStorage
    if (!auth.currentUser) {
      return getAllCoursesProgressFromLocalStorage();
    }
    
    const userId = auth.currentUser.uid;
    
    // Get all courses for this user
    const coursesRef = collection(db, "users", userId, "courses");
    const querySnapshot = await getDocs(coursesRef);
    
    const allProgress = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      allProgress[data.courseName] = data.progress || 0;
    });
    
    // If no courses in Firebase, check localStorage
    if (Object.keys(allProgress).length === 0) {
      return getAllCoursesProgressFromLocalStorage();
    }
    
    return allProgress;
  } catch (error) {
    console.error("Error fetching all courses progress from Firebase:", error);
    return getAllCoursesProgressFromLocalStorage();
  }
};

/**
 * Get overall progress for all courses from localStorage
 * @returns {Object} - Object with course names as keys and progress values as values
 */
const getAllCoursesProgressFromLocalStorage = () => {
  try {
    const allProgress = {};
    
    // Iterate through localStorage and find all course progress entries
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith('course-progress-')) {
        // Extract course name from key
        const courseName = key.replace('course-progress-', '')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase()); // Capitalize words
        
        // Get progress value (fixed radix from 5 to 10)
        const progressValue = parseInt(localStorage.getItem(key) || '0', 10);
        
        // Add to results
        allProgress[courseName] = progressValue;
      }
    }
    
    return allProgress;
  } catch (error) {
    console.error("Error fetching all courses progress from localStorage:", error);
    return {};
  }
};

export default {
  getProgressFromFirebase,
  updateProgressInFirebase,
  incrementProgress,
  getActivityHistory,
  recordActivity,
  resetProgress,
  getAllCoursesProgress
};