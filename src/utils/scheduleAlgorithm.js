/**
 * Intelligent Schedule Generation Algorithm
 * 
 * This module provides functions for generating personalized study schedules
 * based on user preferences, learning styles, and course selections.
 */

import { applySpacedRepetition, optimizeForEnergyLevels, adaptToLearningStyle, calculateOptimalDuration } from './scheduleOptimizer';

/**
 * Generates an optimized study schedule based on user data
 * @param {Object} userData - User preferences and selections
 * @param {string} userData.learningStyle - User's learning style (visual, auditory, reading, kinesthetic)
 * @param {string} userData.studyEnvironment - Preferred study environment
 * @param {string} userData.preferredTime - Preferred time of day to study
 * @param {Array<string>} userData.subjects - Selected subject IDs
 * @param {string} userData.gradeLevel - User's grade level
 * @param {Array<string>} userData.courses - Selected course IDs
 * @param {Array<string>} userData.availableDays - Days available for study
 * @param {string} userData.studyDuration - Preferred study session duration in minutes
 * @param {string} userData.breakFrequency - Preferred break frequency in minutes
 * @returns {Object} - Optimized schedule object
 */
export const generateOptimizedSchedule = (userData) => {
  // Extract user preferences
  const { 
    learningStyle, 
    preferredTime, 
    courses, 
    availableDays, 
    studyDuration, 
    breakFrequency,
    schedulingStyle // 'casual' or 'focused'
  } = userData;

  // Initialize schedule structure
  const schedule = {};
  
  // Convert availableDays to actual day names
  const dayMapping = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  // Create time slots based on preferred time
  let startHour;
  switch(preferredTime) {
    case 'morning':
      startHour = 8; // 8 AM
      break;
    case 'afternoon':
      startHour = 13; // 1 PM
      break;
    case 'evening':
      startHour = 17; // 5 PM
      break;
    case 'night':
      startHour = 20; // 8 PM
      break;
    default:
      startHour = 9; // Default to 9 AM
  }

  // Convert study duration to minutes
  const sessionDuration = parseInt(studyDuration);
  const breakDuration = parseInt(breakFrequency);
  
  // Initialize schedule for each available day
  availableDays.forEach(day => {
    const dayName = dayMapping[day];
    schedule[dayName] = [];
  });

  // Distribute courses optimally across available days
  distributeCoursesOptimally(schedule, courses, availableDays, dayMapping, startHour, sessionDuration, breakDuration, learningStyle, schedulingStyle, userData);
  
  // Apply advanced optimization techniques
  let optimizedSchedule = applySpacedRepetition(schedule, courses);
  optimizedSchedule = optimizeForEnergyLevels(optimizedSchedule, preferredTime);
  optimizedSchedule = adaptToLearningStyle(optimizedSchedule, learningStyle);
  
  return optimizedSchedule;
};

/**
 * Distributes courses optimally across available days based on learning style and other factors
 * @param {Object} schedule - Schedule object to populate
 * @param {Array<string>} courses - Course IDs to distribute
 * @param {Array<string>} availableDays - Available days for scheduling
 * @param {Object} dayMapping - Mapping from day IDs to day names
 * @param {number} startHour - Starting hour for study sessions
 * @param {number} sessionDuration - Duration of each study session in minutes
 * @param {number} breakDuration - Duration of breaks in minutes
 * @param {string} learningStyle - User's learning style
 * @param {string} schedulingStyle - Scheduling style ('casual' or 'focused')
 * @param {Object} userData - User data including custom courses
 */
const distributeCoursesOptimally = (schedule, courses, availableDays, dayMapping, startHour, sessionDuration, breakDuration, learningStyle, schedulingStyle = 'casual', userData = {}) => {
  // Create a copy of courses to distribute
  let coursesToDistribute = [...courses];
  
  // Determine optimal course order based on learning style
  coursesToDistribute = optimizeCourseOrderByLearningStyle(coursesToDistribute, learningStyle);
  
  // For focused learning style, duplicate important courses if we have fewer courses than twice the available days
  if (schedulingStyle === 'focused' && coursesToDistribute.length < availableDays.length * 2) {
    // Identify important courses (for now, we'll consider the first half of the optimized courses as important)
    const importantCourses = coursesToDistribute.slice(0, Math.ceil(coursesToDistribute.length / 2));
    
    // Add important courses again to ensure they're studied multiple times per week
    coursesToDistribute = [...coursesToDistribute, ...importantCourses];
  }
  
  // Calculate how many courses to assign per day
  const coursesPerDay = Math.ceil(coursesToDistribute.length / availableDays.length);
  const maxSessionsPerDay = Math.min(3, coursesPerDay); // Limit to 3 sessions per day
  
  // Distribute courses across days
  availableDays.forEach((day, dayIndex) => {
    const dayName = dayMapping[day];
    let currentHour = startHour;
    let currentMinute = 0;
    
    // Get courses for this day
    const coursesPerDay = Math.max(1, Math.ceil(coursesToDistribute.length / availableDays.length));
    const startIndex = (dayIndex * coursesPerDay) % coursesToDistribute.length;
    const endIndex = Math.min(startIndex + coursesPerDay, coursesToDistribute.length);
    let coursesForDay = coursesToDistribute.slice(startIndex, endIndex);
    
    // If we've run out of courses, cycle back to the beginning
    if (coursesForDay.length === 0 && coursesToDistribute.length > 0) {
      const wrappedIndex = dayIndex % coursesToDistribute.length;
      coursesForDay.push(coursesToDistribute[wrappedIndex]);
    }
    
    // Limit the number of sessions per day according to maxSessionsPerDay
    if (coursesForDay.length > maxSessionsPerDay) {
      coursesForDay = coursesForDay.slice(0, maxSessionsPerDay);
    }
    
    // Create study sessions for each course
    coursesForDay.forEach((course, index) => {
      // Calculate start time for this session
      const startTime = formatTime(currentHour, currentMinute);
      
      // Calculate end time based on session duration
      let endHour = currentHour;
      let endMinute = currentMinute + sessionDuration;
      
      // Adjust if minutes exceed 60
      if (endMinute >= 60) {
        endHour += Math.floor(endMinute / 60);
        endMinute = endMinute % 60;
      }
      
      const endTime = formatTime(endHour, endMinute);
      
      // Parse the course key to get subject and course
      let courseDisplay = course;
      if (course.includes('-')) {
        const [subjectId, courseId] = course.split('-');
        
        // For custom courses
        if (courseId === 'other' && userData.customCourses && userData.customCourses[subjectId]) {
          courseDisplay = userData.customCourses[subjectId];
        } 
        // For regular courses, look up the course label from coursesBySubject
        else {
          // Get course label from predefined courses
          const coursesBySubject = {
            math: [
              { id: 'algebra', label: 'Algebra' },
              { id: 'geometry', label: 'Geometry' },
              { id: 'calculus', label: 'Calculus' },
              { id: 'statistics', label: 'Statistics' },
              { id: 'trigonometry', label: 'Trigonometry' }
            ],
            science: [
              { id: 'biology', label: 'Biology' },
              { id: 'chemistry', label: 'Chemistry' },
              { id: 'physics', label: 'Physics' },
              { id: 'environmental', label: 'Environmental Science' },
              { id: 'astronomy', label: 'Astronomy' }
            ],
            history: [
              { id: 'world', label: 'World History' },
              { id: 'us', label: 'US History' },
              { id: 'european', label: 'European History' },
              { id: 'ancient', label: 'Ancient Civilizations' },
              { id: 'modern', label: 'Modern History' }
            ],
            language: [
              { id: 'composition', label: 'Composition' },
              { id: 'literature', label: 'Literature' },
              { id: 'grammar', label: 'Grammar' },
              { id: 'creative', label: 'Creative Writing' },
              { id: 'speech', label: 'Speech & Debate' }
            ],
            foreign: [
              { id: 'spanish', label: 'Spanish' },
              { id: 'french', label: 'French' },
              { id: 'german', label: 'German' },
              { id: 'chinese', label: 'Chinese' },
              { id: 'japanese', label: 'Japanese' }
            ],
            computer: [
              { id: 'programming', label: 'Programming' },
              { id: 'webdev', label: 'Web Development' },
              { id: 'database', label: 'Database Systems' },
              { id: 'ai', label: 'Artificial Intelligence' },
              { id: 'cybersecurity', label: 'Cybersecurity' }
            ],
            art: [
              { id: 'drawing', label: 'Drawing' },
              { id: 'painting', label: 'Painting' },
              { id: 'sculpture', label: 'Sculpture' },
              { id: 'digital', label: 'Digital Art' }
            ],
            music: [
              { id: 'theory', label: 'Music Theory' },
              { id: 'instrumental', label: 'Instrumental' },
              { id: 'vocal', label: 'Vocal' },
              { id: 'composition', label: 'Composition' }
            ],
            physical: [
              { id: 'fitness', label: 'Fitness' },
              { id: 'sports', label: 'Sports' },
              { id: 'nutrition', label: 'Nutrition' },
              { id: 'wellness', label: 'Wellness' }
            ]
          };
          
          // Find the course in the coursesBySubject
          if (coursesBySubject[subjectId]) {
            const courseObj = coursesBySubject[subjectId].find(c => c.id === courseId);
            if (courseObj) {
              courseDisplay = courseObj.label;
            }
          }
        }
      }
      
      schedule[dayName].push({
        id: `${day}-${index}`,
        course: courseDisplay,
        startTime,
        endTime,
        completed: false
      });
      
      // Add break time and move to next session
      currentMinute += sessionDuration + breakDuration;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    });
  });
};

/**
 * Optimizes course order based on learning style
 * @param {Array<string>} courses - Courses to optimize
 * @param {string} learningStyle - User's learning style
 * @returns {Array<string>} - Optimized course order
 */
const optimizeCourseOrderByLearningStyle = (courses, learningStyle) => {
  // Create a copy of courses
  const optimizedCourses = [...courses];
  
  // Apply different optimization strategies based on learning style
  switch(learningStyle) {
    case 'visual':
      // For visual learners, prioritize courses that benefit from visualization
      prioritizeCourses(optimizedCourses, ['geometry', 'physics', 'programming']);
      break;
    case 'auditory':
      // For auditory learners, prioritize language and discussion-based courses
      prioritizeCourses(optimizedCourses, ['spanish', 'french', 'literature', 'speech']);
      break;
    case 'reading':
      // For reading/writing learners, prioritize text-heavy courses
      prioritizeCourses(optimizedCourses, ['literature', 'history', 'composition']);
      break;
    case 'kinesthetic':
      // For kinesthetic learners, prioritize hands-on courses
      prioritizeCourses(optimizedCourses, ['programming', 'chemistry', 'biology']);
      break;
    default:
      // If no learning style specified, shuffle the courses for variety
      shuffleArray(optimizedCourses);
  }
  
  return optimizedCourses;
};

/**
 * Prioritizes specific courses in the array
 * @param {Array<string>} courses - Array of courses to modify
 * @param {Array<string>} priorityCourses - Courses to prioritize
 */
const prioritizeCourses = (courses, priorityCourses) => {
  // Move priority courses to the beginning
  priorityCourses.forEach(priorityCourse => {
    const index = courses.findIndex(course => course.includes(priorityCourse));
    if (index !== -1) {
      const course = courses.splice(index, 1)[0];
      courses.unshift(course);
    }
  });
};

/**
 * Formats time in 12-hour format (e.g., "9:00 AM")
 * @param {number} hour - Hour (0-23)
 * @param {number} minute - Minute (0-59)
 * @returns {string} - Formatted time string
 */
export const formatTime = (hour, minute) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
  const formattedMinute = minute.toString().padStart(2, '0');
  return `${formattedHour}:${formattedMinute} ${period}`;
};

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array
 */
export const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};