// Progress tracking utilities for AdaptIQ

/**
 * Get progress value from Firebase (or localStorage as fallback)
 * @param {string} courseName - The name of the course
 * @returns {Promise<number>} - The progress value (0-100)
 */
export const getProgressFromFirebase = async (courseName) => {
  try {
    // In a real implementation, this would fetch from Firebase
    // For now, we'll use localStorage as a stand-in for Firebase
    const progressKey = `course-progress-${courseName.toLowerCase().replace(/ /g, '-')}`;
    const storedProgress = localStorage.getItem(progressKey);
    
    // Return stored progress if it exists, otherwise 0
    return storedProgress ? parseInt(storedProgress, 10) : 0;
  } catch (error) {
    console.error("Error fetching progress from storage:", error);
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
    // In a real implementation, this would update Firebase
    // For now, we'll use localStorage as a stand-in for Firebase
    const progressKey = `course-progress-${courseName.toLowerCase().replace(/ /g, '-')}`;
    
    // Ensure progress is within valid range
    const clampedProgress = Math.min(100, Math.max(0, newProgress));
    
    // Store progress in localStorage
    localStorage.setItem(progressKey, clampedProgress.toString());
    
    // Also store update time for tracking activity
    const activityKey = `course-activity-${courseName.toLowerCase().replace(/ /g, '-')}`;
    const activityHistory = JSON.parse(localStorage.getItem(activityKey) || '[]');
    
    // Add new activity entry
    const newActivity = {
      id: Date.now(),
      type: 'progress-update',
      date: new Date(),
      oldProgress: parseInt(localStorage.getItem(progressKey) || '0', 10),
      newProgress: clampedProgress
    };
    
    activityHistory.unshift(newActivity);
    
    // Keep only the latest 50 activities
    if (activityHistory.length > 50) {
      activityHistory.length = 50;
    }
    
    localStorage.setItem(activityKey, JSON.stringify(activityHistory));
    
    return clampedProgress;
  } catch (error) {
    console.error("Error updating progress in storage:", error);
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
 * @returns {Promise<Array>} - Array of activity objects
 */
export const getActivityHistory = async (courseName) => {
  try {
    // In a real implementation, this would fetch from Firebase
    // For now, we'll use localStorage as a stand-in for Firebase
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
    console.error("Error fetching activity history:", error);
    return [];
  }
};

/**
 * Record a learning activity for a course
 * @param {string} courseName - The name of the course
 * @param {string} activityType - Type of activity ('chat', 'quiz', 'resources')
 * @param {string} activityName - Name of the activity
 * @param {number|null} score - Score if applicable (e.g., for quizzes)
 * @returns {Promise<Object>} - The recorded activity object
 */
export const recordActivity = async (courseName, activityType, activityName, score = null) => {
  try {
    const activityKey = `course-activity-${courseName.toLowerCase().replace(/ /g, '-')}`;
    const activityHistory = JSON.parse(localStorage.getItem(activityKey) || '[]');
    
    // Create new activity object
    const newActivity = {
      id: Date.now(),
      type: activityType,
      name: activityName,
      date: new Date(),
      score: score
    };
    
    // Add to the beginning of the array
    activityHistory.unshift(newActivity);
    
    // Keep only the latest 50 activities
    if (activityHistory.length > 50) {
      activityHistory.length = 50;
    }
    
    // Save to localStorage
    localStorage.setItem(activityKey, JSON.stringify(activityHistory));
    
    // Increment progress based on activity type
    // Each activity type contributes differently to overall progress
    let progressIncrement = 0;
    
    switch (activityType) {
      case 'quiz':
        // Quiz contributes more to progress
        progressIncrement = 10;
        break;
      case 'chat':
        // Chat contributes moderately to progress
        progressIncrement = 5;
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
    console.error("Error recording activity:", error);
    return null;
  }
};

/**
 * Reset progress for a course
 * @param {string} courseName - The name of the course
 * @returns {Promise<boolean>} - Success status
 */
export const resetProgress = async (courseName) => {
  try {
    // Reset progress to 0
    await updateProgressInFirebase(courseName, 0);
    
    // Clear activity history
    const activityKey = `course-activity-${courseName.toLowerCase().replace(/ /g, '-')}`;
    localStorage.removeItem(activityKey);
    
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
    // In a real implementation, this would be a single Firebase query
    // For our localStorage implementation, we need to scan for keys
    const allProgress = {};
    
    // Iterate through localStorage and find all course progress entries
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith('course-progress-')) {
        // Extract course name from key
        const courseName = key.replace('course-progress-', '')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase()); // Capitalize words
        
        // Get progress value
        const progressValue = parseInt(localStorage.getItem(key) || '0', 10);
        
        // Add to results
        allProgress[courseName] = progressValue;
      }
    }
    
    return allProgress;
  } catch (error) {
    console.error("Error fetching all courses progress:", error);
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