/**
 * Progress Tracker Utility
 * 
 * This module provides functions for tracking and updating user progress
 * in courses, with Firebase integration placeholders.
 */

// Mock data for development - will be replaced with Firebase
const MOCK_PROGRESS_DATA = {
  'Algebra': 45,
  'Geometry': 72,
  'Calculus': 28,
  'Physics': 60,
  'Chemistry': 36,
  'Biology': 55,
  'World History': 68,
  'Programming': 31,
  'Web Development': 20,
  'General Psychology': 76
};

/**
 * Fetches a user's progress for a specific course from Firebase
 * @param {string} courseName - The name of the course
 * @returns {Promise<number>} - The progress percentage (0-100)
 */
export const getProgressFromFirebase = async (courseName) => {
  try {
    // Placeholder for Firebase data fetching
    // In a real implementation, this would be:
    // const db = getFirestore();
    // const userDoc = await getDoc(doc(db, 'users', userId));
    // const progress = userDoc.data().courses[courseName]?.progress || 0;
    // return progress;
    
    // For now, return mock data or a random value
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    return MOCK_PROGRESS_DATA[courseName] || Math.floor(Math.random() * 101);
  } catch (error) {
    console.error('Error fetching progress:', error);
    return 0;
  }
};

/**
 * Updates a user's progress for a specific course in Firebase
 * @param {string} courseName - The name of the course
 * @param {number} progressValue - The new progress value (0-100)
 * @returns {Promise<boolean>} - Success status
 */
export const updateProgressInFirebase = async (courseName, progressValue) => {
  try {
    // Placeholder for Firebase data updating
    // In a real implementation, this would be:
    // const db = getFirestore();
    // await updateDoc(doc(db, 'users', userId), {
    //   [`courses.${courseName}.progress`]: progressValue
    // });
    
    // For now, just log and return success
    console.log(`Updated progress for ${courseName} to ${progressValue}%`);
    MOCK_PROGRESS_DATA[courseName] = progressValue;
    return true;
  } catch (error) {
    console.error('Error updating progress:', error);
    return false;
  }
};

/**
 * Increments a user's progress for a specific course by a specified amount
 * @param {string} courseName - The name of the course
 * @param {number} incrementAmount - Amount to increment (default: 5)
 * @returns {Promise<number>} - The new progress value
 */
export const incrementProgress = async (courseName, incrementAmount = 5) => {
  try {
    const currentProgress = await getProgressFromFirebase(courseName);
    const newProgress = Math.min(100, currentProgress + incrementAmount);
    
    await updateProgressInFirebase(courseName, newProgress);
    return newProgress;
  } catch (error) {
    console.error('Error incrementing progress:', error);
    return null;
  }
};

/**
 * Calculates progress based on completed learning activities
 * @param {string} courseName - The name of the course
 * @param {Array} completedActivities - Array of completed activity IDs
 * @param {Array} totalActivities - Array of all activity IDs for the course
 * @returns {number} - The calculated progress percentage
 */
export const calculateProgressFromActivities = (completedActivities, totalActivities) => {
  if (!totalActivities || totalActivities.length === 0) {
    return 0;
  }
  
  return Math.floor((completedActivities.length / totalActivities.length) * 100);
};

/**
 * Calculates progress based on quiz scores
 * @param {Array} quizScores - Array of quiz score objects {quizId, score, maxScore}
 * @returns {number} - The calculated progress percentage
 */
export const calculateProgressFromQuizzes = (quizScores) => {
  if (!quizScores || quizScores.length === 0) {
    return 0;
  }
  
  const totalEarned = quizScores.reduce((sum, quiz) => sum + quiz.score, 0);
  const totalPossible = quizScores.reduce((sum, quiz) => sum + quiz.maxScore, 0);
  
  return Math.floor((totalEarned / totalPossible) * 100);
};

/**
 * Get activity history for a course
 * @param {string} courseName - The name of the course
 * @returns {Promise<Array>} - Array of activity records
 */
export const getActivityHistory = async (courseName) => {
  try {
    // Placeholder for Firebase data fetching
    // Would fetch user's activity history for the course
    
    // Mock data for now
    await new Promise(resolve => setTimeout(resolve, 600));
    return [
      { id: 1, type: 'quiz', name: 'Quiz 1', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), score: 85 },
      { id: 2, type: 'resource', name: 'Chapter 3 Reading', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { id: 3, type: 'chat', name: 'Tutor Session', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { id: 4, type: 'quiz', name: 'Practice Problems', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), score: 92 }
    ].filter(() => Math.random() > 0.3); // Randomly filter to simulate different activity levels
  } catch (error) {
    console.error('Error fetching activity history:', error);
    return [];
  }
};