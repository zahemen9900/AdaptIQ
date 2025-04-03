// Assignment utility functions for AdaptIQ
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  auth, 
  db, 
  saveUserAssignments, 
  getUserAssignments,
  updateAssignment, 
  getAllUserAssignments,
  getCurrentWeekId
} from '../../firebase';
import { doc, getDoc } from '@firebase/firestore';
import { getSubjectImageUrl } from './subjectImageUtils';

// Initialize the Google Generative AI with the API key
// In production, this should be properly handled with environment variables
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Function to generate an assignment using Gemini AI
export const generateAssignmentWithGemini = async (subject, topic, type = 'assignment') => {
  try {
    // Prepare the prompt based on assignment type
    const prompt = prepareGeminiPrompt(subject, topic, type);
    
    // Generate content with Gemini
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Parse the response to extract assignment details
    const parsedResponse = parseGeminiResponse(text, subject, topic);
    
    // Create the assignment object
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 7) + 1); // Due 1-7 days from now
    
    const category = getCategoryForSubject(subject);
    
    return {
      id: `assignment-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: parsedResponse.title,
      subject,
      category,
      description: parsedResponse.description,
      dueDate: dueDate.toISOString(),
      createdDate: new Date().toISOString(),
      estimatedMinutes: parsedResponse.estimatedMinutes,
      imageUrl: getSubjectImageUrl(subject, category),
      status: 'pending',
      priority: calculatePriority(dueDate),
      resources: generateMockResources(subject, category)
    };
  } catch (error) {
    console.error("Error generating assignment with Gemini:", error);
    
    // Fall back to local generation if API fails
    return generateAssignment(subject, new Date());
  }
};

// Parse Gemini's response to extract title, description, and estimated time
const parseGeminiResponse = (response, subject, topic) => {
  let title = `${subject} Assignment: ${topic.charAt(0).toUpperCase() + topic.slice(1)}`;
  let description = response;
  let estimatedMinutes = 45;

  // Try to extract a better title from the response
  const titleMatch = response.match(/^#\s*(.*?)$/m) || 
                     response.match(/^Title:\s*(.*?)$/m) ||
                     response.match(/^Assignment:\s*(.*?)$/m);
  
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim();
  }
  
  // Try to extract estimated time
  const timeMatch = response.match(/estimated time:?\s*(\d+)[-\s]?(\d*)\s*(minutes|hours|mins|min)/i) ||
                   response.match(/time required:?\s*(\d+)[-\s]?(\d*)\s*(minutes|hours|mins|min)/i) ||
                   response.match(/duration:?\s*(\d+)[-\s]?(\d*)\s*(minutes|hours|mins|min)/i);
  
  if (timeMatch) {
    const unit = timeMatch[3].toLowerCase();
    if (unit.includes('hour')) {
      estimatedMinutes = parseInt(timeMatch[1]) * 60;
      if (timeMatch[2]) {
        estimatedMinutes += parseInt(timeMatch[2]);
      }
    } else {
      estimatedMinutes = parseInt(timeMatch[1]);
    }
  }
  
  return {
    title,
    description,
    estimatedMinutes
  };
};

// Prepare prompts for Gemini to generate different types of assignments
export const prepareGeminiPrompt = (subject, topic, type = 'assignment') => {
  const prompts = {
    assignment: `You are AdaptIQ, an intelligent AI assistant specialized in education. Create a detailed assignment for a ${subject} course focused on the topic of "${topic}". 
    
Format your response as follows:
# [Create a compelling title for the assignment]

## Assignment Description
[Write a 2-3 paragraph description of the assignment, explaining what students need to do]

## Learning Objectives
- [List 3-5 specific learning objectives]

## Tasks
1. [First required task with details]
2. [Second required task with details]
3. [Additional tasks as needed]

## Evaluation Criteria
- [Criterion 1]
- [Criterion 2]
- [Criterion 3]

## Estimated Time: [Provide an estimated completion time in minutes]
`,
    quiz: `You are AdaptIQ, an intelligent AI tutor. Generate a comprehensive quiz for ${subject} on the topic of "${topic}" with a mix of multiple choice and short answer questions.

Format your response as follows:
# ${subject} Quiz: ${topic}

## Instructions
[Brief instructions for taking the quiz]

## Questions
1. [First question]
   a) [option]
   b) [option]
   c) [option]
   d) [option]

2. [Short answer question]

3. [Additional questions...]

## Estimated Time: [Provide an estimated completion time in minutes]
`,
    project: `You are AdaptIQ, an intelligent AI education assistant. Design an assignment for ${subject} focused on "${topic}".

Format your response as follows:
# ${subject} Project: ${topic}

## Project Overview
[Write a compelling description of the project, its purpose and relevance]

## Project Requirements
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

## Milestones
1. [First milestone with deadline]
2. [Second milestone with deadline]
3. [Final deliverable]

## Assessment Criteria
- [Criterion 1]
- [Criterion 2]
- [Criterion 3]

## Estimated Time: [Provide an estimated completion time in minutes]

---
The project should take about 30-60 minutes to complete. Include a list of resources that students can use to complete the project.
`
  };
  
  return prompts[type] || prompts.assignment;
};

// Get the category for a subject
const getCategoryForSubject = (subject) => {
  const categoryMapping = {
    'Algebra': 'mathematics',
    'Geometry': 'mathematics',
    'Calculus': 'mathematics',
    'Statistics': 'mathematics',
    'Trigonometry': 'mathematics',
    'Biology': 'science',
    'Chemistry': 'science',
    'Physics': 'science',
    'Environmental Science': 'science',
    'Astronomy': 'science',
    'World History': 'history',
    'US History': 'history',
    'European History': 'history',
    'Ancient Civilizations': 'history',
    'Modern History': 'history',
    'Spanish': 'foreign',
    'French': 'foreign',
    'German': 'foreign',
    'Chinese': 'foreign',
    'Japanese': 'foreign',
    'Programming': 'computer-science',
    'Web Development': 'computer-science',
    'Database Systems': 'computer-science',
    'Artificial Intelligence': 'computer-science',
    'Cybersecurity': 'computer-science',
    'Mechanical Engineering': 'engineering',
    'Electrical Engineering': 'engineering',
    'Civil Engineering': 'engineering',
    'Chemical Engineering': 'engineering',
    'Software Engineering': 'engineering',
    'Microeconomics': 'economics',
    'Macroeconomics': 'economics',
    'International Economics': 'economics',
    'Business Economics': 'economics',
    'Financial Economics': 'economics',
    'Clinical Psychology': 'psychology',
    'Cognitive Psychology': 'psychology',
    'Developmental Psychology': 'psychology',
    'Social Psychology': 'psychology',
    'Abnormal Psychology': 'psychology',
    'Drawing': 'art',
    'Painting': 'art',
    'Sculpture': 'art',
    'Digital Art': 'art',
    'Music Theory': 'music',
    'Instrumental': 'music',
    'Vocal': 'music',
    'Composition': 'music',
    'Other': 'general',
    'Mathematics': 'mathematics',
    'Science': 'science',
    'History': 'history',
    'Language Arts': 'language',
    'Foreign Languages': 'foreign',
    'Computer Science': 'computer-science',
    'Art & Design': 'art',
    'Music': 'music',
    'Physical Education': 'physical',
    'Economics': 'economics',
    'Psychology': 'psychology',
    'Engineering': 'engineering'
  };
  
  return categoryMapping[subject] || 'general';
};

// Fetch user subjects from Firebase
export const fetchUserSubjects = async () => {
  try {
    if (!auth.currentUser) {
      console.warn("No user signed in");
      return { subjects: [], selectedCourses: {} };
    }

    const userRef = doc(db, "users", auth.currentUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.warn("User document not found");
      return { subjects: [], selectedCourses: {} };
    }

    const userData = userSnap.data();
    
    // Get both subjects and specific courses
    const selectedSubjects = [];
    const selectedCourses = {};
    
    // First try to get subjects directly if available
    if (userData.subjects && userData.subjects.length > 0) {
      userData.subjects.forEach(subjectId => {
        const subjectMap = {
          'math': 'Mathematics',
          'science': 'Science',
          'history': 'History',
          'language': 'Language Arts',
          'foreign': 'Foreign Languages',
          'computer': 'Computer Science',
          'art': 'Art & Design',
          'music': 'Music',
          'physical': 'Physical Education',
          'economics': 'Economics',
          'psychology': 'Psychology',
          'engineering': 'Engineering'
        };
        const subjectName = subjectMap[subjectId] || subjectId;
        selectedSubjects.push(subjectName);
        
        // Initialize the selected courses for this subject
        if (!selectedCourses[subjectName]) {
          selectedCourses[subjectName] = [];
        }
      });
    }

    // Get specific courses the user has selected
    if (userData.courses && userData.courses.length > 0) {
      userData.courses.forEach(courseId => {
        const parts = courseId.split('-');
        if (parts.length >= 2) {
          const subjectId = parts[0];
          const courseId = parts[1];
          
          // Map subject IDs to full subject names
          const subjectMap = {
            'math': 'Mathematics',
            'science': 'Science',
            'history': 'History',
            'language': 'Language Arts',
            'foreign': 'Foreign Languages',
            'computer': 'Computer Science',
            'art': 'Art & Design',
            'music': 'Music',
            'physical': 'Physical Education',
            'economics': 'Economics',
            'psychology': 'Psychology',
            'engineering': 'Engineering'
          };
          
          // Map course IDs to full course names
          const courseMap = {
            // Math courses
            'algebra': 'Algebra',
            'geometry': 'Geometry',
            'calculus': 'Calculus',
            'statistics': 'Statistics',
            'trigonometry': 'Trigonometry',
            
            // Science courses
            'biology': 'Biology',
            'chemistry': 'Chemistry',
            'physics': 'Physics',
            'environmental': 'Environmental Science',
            'astronomy': 'Astronomy',
            
            // History courses
            'world': 'World History',
            'us': 'US History',
            'european': 'European History',
            'ancient': 'Ancient Civilizations',
            'modern': 'Modern History',
            
            // Computer science courses
            'programming': 'Programming',
            'webdev': 'Web Development',
            'database': 'Database Systems',
            'ai': 'Artificial Intelligence',
            'cybersecurity': 'Cybersecurity',
            
            // Engineering courses
            'mechanical': 'Mechanical Engineering',
            'electrical': 'Electrical Engineering',
            'civil': 'Civil Engineering',
            'chemical': 'Chemical Engineering',
            'software': 'Software Engineering',
            
            // Other courses
            'other': 'Other'
          };
          
          const subjectName = subjectMap[subjectId] || subjectId;
          
          // Make sure this subject is in the selectedCourses map
          if (!selectedCourses[subjectName]) {
            selectedCourses[subjectName] = [];
          }
          
          // Add the specific course to our list if it's a known course
          if (courseMap[courseId]) {
            selectedCourses[subjectName].push(courseMap[courseId]);
          }
          
          // If user has custom courses, add them too
          if (courseId === 'other' && userData.customCourses && userData.customCourses[subjectId]) {
            selectedCourses[subjectName].push(userData.customCourses[subjectId]);
          }
        }
      });
    }

    // Return both subjects and the mapping of selected courses
    return {
      subjects: selectedSubjects,
      selectedCourses: selectedCourses
    };
  } catch (error) {
    console.error("Error fetching user subjects:", error);
    return { subjects: [], selectedCourses: {} };
  }
};

// Select a subset of subjects for assignments
export const selectSubjectsForAssignments = (subjects, maxSubjects = 4) => {
  if (!subjects || subjects.length === 0) {
    return [];
  }

  // If we have 4 or fewer subjects, use all of them
  if (subjects.length <= maxSubjects) {
    return subjects;
  }
  
  // Otherwise, randomly select maxSubjects subjects
  const shuffled = [...subjects].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, maxSubjects);
};

// The existing generateAssignment function will be kept as a fallback
export const generateAssignment = (subject, dueDate, courseLevel = 'intermediate') => {
  const mockAssignmentTemplates = {
    mathematics: [
      "Complete practice problems on {topic} with step-by-step solutions.",
      "Write a reflection on the applications of {topic} in real-world scenarios.",
      "Create a visual representation of key concepts in {topic}."
    ],
    science: [
      "Design an experiment to demonstrate {topic} and document your findings.",
      "Research and write a summary of recent advancements in {topic}.",
      "Create a diagram explaining the process of {topic} with detailed annotations."
    ],
    history: [
      "Write an analysis of how {topic} influenced modern society.",
      "Compare different historical perspectives on {topic} and evaluate their biases.",
      "Create a timeline of key events related to {topic}."
    ],
    language: [
      "Write a critical analysis of themes found in the assigned readings on {topic}.",
      "Create a presentation analyzing the author's use of literary devices in {topic}.",
      "Write an essay discussing different interpretations of {topic}."
    ],
    "computer-science": [
      "Implement an algorithm that solves a problem related to {topic}.",
      "Create a project that demonstrates your understanding of {topic}.",
      "Write a technical paper explaining how {topic} works with practical examples."
    ],
    engineering: [
      "Write a technical report explaining key principles of {topic} and their applications.",
      "Analyze a case study of a real-world engineering problem related to {topic}.",
      "Write a research paper discussing the challenges and solutions in {topic}."
    ],
    economics: [
      "Analyze the impact of {topic} on global or local economies with data evidence.",
      "Write a policy brief explaining key economic theories related to {topic}.",
      "Create a comparative analysis of different economic models relevant to {topic}."
    ],
    psychology: [
      "Write an essay analyzing psychological aspects of {topic} and its real-world implications.",
      "Research and write a detailed paper on famous psychological experiments related to {topic}.",
      "Summarize key psychological theories and concepts associated with {topic}."
    ],
    art: [
      "Write a critical analysis of the artistic techniques used in {topic}.",
      "Research and write a paper discussing how {topic} has influenced modern art.",
      "Write an essay comparing different artistic interpretations of {topic}."
    ],
    music: [
      "Write an analysis of a famous piece of music that demonstrates {topic}.",
      "Compose a detailed analysis of how {topic} is used in a specific musical genre.",
      "Write a research paper on the historical significance of {topic} in music theory."
    ],
    physical: [
      "Write a detailed research paper on the effects of {topic} on health and wellness.",
      "Analyze and summarize the impact of {topic} on athletic performance.",
      "Write a comparative essay on various fitness or nutrition plans related to {topic}."
    ],
    foreign: [
      "Write a short essay in the target language about {topic}.",
      "Create a dialogue demonstrating proper use of grammar related to {topic}.",
      "Research and present cultural aspects connected to {topic}."
    ],
    general: [
      "Write a comprehensive essay exploring the main concepts of {topic}.",
      "Create a presentation that explains key principles of {topic}.",
      "Research and summarize recent developments related to {topic}."
    ]
  };

  // Get topic based on subject
  const getRandomTopic = (subject) => {
    return getRandomTopicForSubject(subject);
  };
  
  const category = getCategoryForSubject(subject) || 'general';
  const templates = mockAssignmentTemplates[category] || mockAssignmentTemplates.general;
  const templateIndex = Math.floor(Math.random() * templates.length);
  const topic = getRandomTopic(subject) || 'recent topics';
  
  const title = `${subject} Assignment: ${topic.charAt(0).toUpperCase() + topic.slice(1)}`;
  const description = templates[templateIndex].replace('{topic}', topic);
  
  // Calculate estimated time based on course level
  let estimatedMinutes = 45;
  if (courseLevel === 'beginner') estimatedMinutes = 30;
  if (courseLevel === 'advanced') estimatedMinutes = 60;
  
  return {
    id: `assignment-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    subject,
    category,
    description,
    dueDate: dueDate.toISOString(),
    createdDate: new Date().toISOString(),
    estimatedMinutes,
    imageUrl: getSubjectImageUrl(subject, category),
    status: 'pending',
    priority: calculatePriority(dueDate),
    resources: generateMockResources(subject, category)
  };
};

// Generate assignments for selected subjects
export const generateAssignmentsForSubjects = async (subjects, count = 1) => {
  if (!subjects || subjects.length === 0) {
    return [];
  }
  
  const assignments = [];
  const courseLevels = ['beginner', 'intermediate', 'advanced'];
  
  // For each subject, generate the specified number of assignments
  for (const subject of subjects) {
    for (let i = 0; i < count; i++) {
      // Set due date between 1-7 days from now
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 7) + 1);
      
      // Randomly select course level
      const levelIndex = Math.floor(Math.random() * courseLevels.length);
      const courseLevel = courseLevels[levelIndex];
      
      // Try to generate with Gemini first, fall back to local generation if needed
      try {
        const topic = getRandomTopicForSubject(subject);
        
        // Randomly select assignment type
        const assignmentTypes = ['assignment', 'quiz', 'project'];
        const typeIndex = Math.floor(Math.random() * assignmentTypes.length);
        const assignmentType = assignmentTypes[typeIndex];
        
        const assignment = await generateAssignmentWithGemini(subject, topic, assignmentType)
          .catch(error => {
            console.error(`Error generating assignment with Gemini for ${subject}:`, error);
            return generateAssignment(subject, dueDate, courseLevel);
          });
        
        assignments.push(assignment);
      } catch (error) {
        console.error(`Error generating assignment for ${subject}:`, error);
        const fallbackAssignment = generateAssignment(subject, dueDate, courseLevel);
        assignments.push(fallbackAssignment);
      }
    }
  }
  
  return assignments;
};

// Calculate priority based on due date (higher number = higher priority)
export const calculatePriority = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 5; // Overdue
  if (diffDays === 0) return 4; // Due today
  if (diffDays <= 1) return 3; // Due tomorrow
  if (diffDays <= 3) return 2; // Due within 3 days
  if (diffDays <= 7) return 1; // Due within a week
  return 0; // Due later
};

// Get priority label and color
export const getPriorityInfo = (priority) => {
  const priorityMap = {
    0: { label: 'Low Priority', color: '#8bc34a', bgColor: 'rgba(139, 195, 74, 0.1)' },
    1: { label: 'Normal', color: '#03a9f4', bgColor: 'rgba(3, 169, 244, 0.1)' },
    2: { label: 'Medium', color: '#ff9800', bgColor: 'rgba(255, 152, 0, 0.1)' },
    3: { label: 'High Priority', color: '#f44336', bgColor: 'rgba(244, 67, 54, 0.1)' },
    4: { label: 'Due Today', color: '#e91e63', bgColor: 'rgba(233, 30, 99, 0.1)' },
    5: { label: 'Overdue', color: '#9c27b0', bgColor: 'rgba(156, 39, 176, 0.1)' }
  };
  
  return priorityMap[priority] || priorityMap[0];
};

// Update assignment status based on current date
export const updateAssignmentStatus = (assignment) => {
  const now = new Date();
  const dueDate = new Date(assignment.dueDate);
  
  if (assignment.status === 'completed') {
    return assignment;
  }
  
  if (now > dueDate && assignment.status !== 'completed') {
    return {
      ...assignment,
      status: 'overdue',
      priority: 5
    };
  }
  
  return assignment;
};

// Get formatted date string
export const formatAssignmentDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Generate mock resources for assignments
const generateMockResources = (subject, category) => {
  const resourceCount = Math.floor(Math.random() * 3) + 1; // 1-3 resources
  const resources = [];
  
  const resourceTypes = ['reading', 'video', 'practice'];
  
  for (let i = 0; i < resourceCount; i++) {
    const typeIndex = Math.floor(Math.random() * resourceTypes.length);
    const resourceType = resourceTypes[typeIndex];
    
    resources.push({
      id: `resource-${Date.now()}-${Math.floor(Math.random() * 1000)}-${i}`,
      title: getResourceTitle(subject, resourceType),
      type: resourceType,
      url: '#'
    });
  }
  
  return resources;
};

const getResourceTitle = (subject, type) => {
  const readingTitles = [
    `Understanding ${subject} Fundamentals`,
    `Advanced ${subject} Concepts`,
    `${subject}: Theory and Practice`,
    `Essential ${subject} Research Paper`
  ];
  
  const videoTitles = [
    `${subject} Explained Visually`,
    `Step-by-step ${subject} Tutorial`,
    `${subject} in Action`,
    `Visual Guide to ${subject}`
  ];
  
  const practiceTitles = [
    `${subject} Practice Problems`,
    `Interactive ${subject} Exercises`,
    `${subject} Skill Builder`,
    `${subject} Challenge Questions`
  ];
  
  const titles = {
    reading: readingTitles,
    video: videoTitles,
    practice: practiceTitles
  };
  
  const options = titles[type] || readingTitles;
  const index = Math.floor(Math.random() * options.length);
  return options[index];
};

// Sort assignments by priority and date
export const sortAssignments = (assignments, sortBy = 'dueDate') => {
  if (!assignments || assignments.length === 0) {
    return [];
  }
  
  return [...assignments].sort((a, b) => {
    if (sortBy === 'priority') {
      return b.priority - a.priority;
    } else if (sortBy === 'subject') {
      return a.subject.localeCompare(b.subject);
    } else if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    } else { // default: dueDate
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
  });
};

// Group assignments by date for calendar view
export const groupAssignmentsByDate = (assignments) => {
  const grouped = {};
  
  if (!assignments || assignments.length === 0) {
    return grouped;
  }
  
  assignments.forEach(assignment => {
    const dueDate = new Date(assignment.dueDate);
    const dateKey = dueDate.toISOString().split('T')[0];
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    
    grouped[dateKey].push(assignment);
  });
  
  return grouped;
};

// Generate dates for calendar view
export const generateCalendarDates = (year, month) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const dates = [];
  
  // Add days from previous month to fill first week
  const prevMonthDays = firstDayOfMonth;
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    dates.push({
      date,
      day: date.getDate(),
      isCurrentMonth: false,
      isToday: isSameDay(date, new Date())
    });
  }
  
  // Add days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    dates.push({
      date,
      day,
      isCurrentMonth: true,
      isToday: isSameDay(date, new Date())
    });
  }
  
  // Fill remaining calendar slots with days from next month
  const totalDaysNeeded = Math.ceil(dates.length / 7) * 7;
  const nextMonthDays = totalDaysNeeded - dates.length;
  
  for (let day = 1; day <= nextMonthDays; day++) {
    const date = new Date(year, month + 1, day);
    dates.push({
      date,
      day,
      isCurrentMonth: false,
      isToday: isSameDay(date, new Date())
    });
  }
  
  return dates;
};

// Check if two dates are the same day
export const isSameDay = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Filter assignments by various criteria
export const filterAssignments = (assignments, filters) => {
  if (!assignments || assignments.length === 0) {
    return [];
  }
  
  return assignments.filter(assignment => {
    // Filter by status
    if (filters.status !== 'all' && assignment.status !== filters.status) {
      return false;
    }
    
    // Filter by subject
    if (filters.subject !== 'all' && assignment.subject !== filters.subject) {
      return false;
    }
    
    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const titleMatch = assignment.title.toLowerCase().includes(searchLower);
      const descMatch = assignment.description.toLowerCase().includes(searchLower);
      const subjectMatch = assignment.subject.toLowerCase().includes(searchLower);
      
      if (!titleMatch && !descMatch && !subjectMatch) {
        return false;
      }
    }
    
    // Filter by date range (if implemented)
    if (filters.dateRange) {
      const dueDate = new Date(assignment.dueDate);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      
      if (dueDate < startDate || dueDate > endDate) {
        return false;
      }
    }
    
    return true;
  });
};

// Save assignments to Firebase
export const saveAssignments = async (assignments) => {
  try {
    if (!auth.currentUser) {
      console.error("No user authenticated");
      return false;
    }
    
    const userId = auth.currentUser.uid;
    const weekId = getCurrentWeekId();
    
    const response = await saveUserAssignments(userId, assignments, weekId);
    
    if (response.success) {
      console.log(`Assignments saved to Firebase: ${response.message}`);
      return true;
    } else {
      console.error("Error saving assignments to Firebase:", response.error);
      return false;
    }
  } catch (error) {
    console.error("Error saving assignments:", error);
    return false;
  }
};

// Get assignments from Firebase
export const getAssignments = async (weekId = null) => {
  try {
    if (!auth.currentUser) {
      console.error("No user authenticated");
      return [];
    }
    
    const userId = auth.currentUser.uid;
    
    // If no weekId is provided, use current week
    const currentWeekId = weekId || getCurrentWeekId();
    const response = await getUserAssignments(userId, currentWeekId);
    
    if (response.success) {
      return response.assignments.map(updateAssignmentStatus);
    } else {
      console.error("Error retrieving assignments from Firebase:", response.error);
      return [];
    }
  } catch (error) {
    console.error("Error retrieving assignments:", error);
    return [];
  }
};

// Get all assignments for a user across all weeks
export const getAllAssignments = async () => {
  try {
    if (!auth.currentUser) {
      console.error("No user authenticated");
      return [];
    }
    
    const userId = auth.currentUser.uid;
    const response = await getAllUserAssignments(userId);
    
    if (response.success) {
      return response.assignments.map(updateAssignmentStatus);
    } else {
      console.error("Error retrieving all assignments:", response.error);
      return [];
    }
  } catch (error) {
    console.error("Error retrieving all assignments:", error);
    return [];
  }
};

// Update a single assignment in Firebase
export const updateSingleAssignment = async (assignment) => {
  try {
    if (!auth.currentUser || !assignment || !assignment.firestoreId) {
      console.error("Cannot update assignment: Missing user, assignment, or Firebase ID");
      return false;
    }
    
    const userId = auth.currentUser.uid;
    const assignmentId = assignment.firestoreId;
    
    // Extract only the fields that can be updated
    const updates = {
      status: assignment.status,
      completedDate: assignment.completedDate,
      submission: assignment.submission,
      feedback: assignment.feedback,
      grade: assignment.grade,
      priority: assignment.priority
    };
    
    const response = await updateAssignment(userId, assignmentId, updates);
    
    if (response.success) {
      return true;
    } else {
      console.error("Error updating assignment in Firebase:", response.error);
      return false;
    }
  } catch (error) {
    console.error("Error updating assignment:", error);
    return false;
  }
};

// Generate assignments for a user based on their subjects
export const generateUserAssignments = async () => {
  try {
    // 1. Fetch user subjects from Firebase
    const userSubjects = await fetchUserSubjects();
    
    if (!userSubjects || userSubjects.length === 0) {
      console.warn("No subjects found for user");
      return [];
    }
    
    // 2. Select subjects for assignments (max 4 if more than 4 are available)
    const selectedSubjects = selectSubjectsForAssignments(userSubjects);
    
    // 3. Generate assignments for selected subjects
    const assignments = await generateAssignmentsForSubjects(selectedSubjects);
    
    // 4. Save assignments to Firebase
    const saved = await saveAssignments(assignments);
    
    if (!saved) {
      console.error("Failed to save generated assignments to Firebase");
    }
    
    return assignments;
  } catch (error) {
    console.error("Error generating user assignments:", error);
    return [];
  }
};

// Ensure user has assignments - check if there are assignments due within a week
export const ensureUserHasAssignments = async () => {
  try {
    // Get current week ID
    const weekId = getCurrentWeekId();
    
    // Get existing assignments for the current week
    const existingAssignments = await getAssignments(weekId);
    
    // If there are no assignments for this week, generate new ones
    if (!existingAssignments || existingAssignments.length === 0) {
      console.log("No assignments found for current week, generating new ones");
      return await generateUserAssignments();
    }
    
    return existingAssignments;
  } catch (error) {
    console.error("Error ensuring user has assignments:", error);
    return [];
  }
};

// Export helper function to get a random topic for a subject
export const getRandomTopicForSubject = (subject) => {
  // Get user's selected courses
  let userSelectedCourses = {};
  let userCustomSubjects = {};
  let userCustomCourses = {};
  
  try {
    // Try to get the selected courses from localStorage (temporary solution)
    const onboardingData = localStorage.getItem('onboardingData');
    if (onboardingData) {
      const userData = JSON.parse(onboardingData);
      
      // Build a mapping of subjects to selected courses
      userSelectedCourses = {};
      
      if (userData.courses && userData.courses.length > 0) {
        userData.courses.forEach(courseId => {
          const parts = courseId.split('-');
          if (parts.length >= 2) {
            const subjectId = parts[0];
            const courseId = parts[1];
            
            // Map subject IDs to full subject names
            const subjectMap = {
              'math': 'Mathematics',
              'science': 'Science',
              'history': 'History',
              'language': 'Language Arts',
              'foreign': 'Foreign Languages',
              'computer': 'Computer Science',
              'art': 'Art & Design',
              'music': 'Music',
              'physical': 'Physical Education',
              'economics': 'Economics',
              'psychology': 'Psychology',
              'engineering': 'Engineering'
            };
            
            // Map course IDs to full course names
            const courseMap = {
              // Math courses
              'algebra': 'Algebra',
              'geometry': 'Geometry',
              'calculus': 'Calculus',
              'statistics': 'Statistics',
              'trigonometry': 'Trigonometry',
              
              // Science courses
              'biology': 'Biology',
              'chemistry': 'Chemistry',
              'physics': 'Physics',
              'environmental': 'Environmental Science',
              'astronomy': 'Astronomy',
              
              // History courses
              'world': 'World History',
              'us': 'US History',
              'european': 'European History',
              'ancient': 'Ancient Civilizations',
              'modern': 'Modern History',
              
              // Computer science courses
              'programming': 'Programming',
              'webdev': 'Web Development',
              'database': 'Database Systems',
              'ai': 'Artificial Intelligence',
              'cybersecurity': 'Cybersecurity',
              
              // Engineering courses
              'mechanical': 'Mechanical Engineering',
              'electrical': 'Electrical Engineering',
              'civil': 'Civil Engineering',
              'chemical': 'Chemical Engineering',
              'software': 'Software Engineering',
              
              // Other courses
              'other': 'Other'
            };
            
            const subjectName = subjectMap[subjectId] || subjectId;
            const courseName = courseMap[courseId] || courseId;
            
            if (!userSelectedCourses[subjectName]) {
              userSelectedCourses[subjectName] = [];
            }
            
            userSelectedCourses[subjectName].push(courseName);
            
            // If user has custom courses, add them too
            if (courseId === 'other' && userData.customCourses && userData.customCourses[subjectId]) {
              userSelectedCourses[subjectName].push(userData.customCourses[subjectId]);
              userCustomCourses[subjectName] = userData.customCourses[subjectId];
            }
          }
        });
      }
      
      // Handle custom subject if present
      if (userData.subjects && userData.subjects.includes('other') && userData.customSubject) {
        const customSubjectName = userData.customSubject;
        userCustomSubjects[customSubjectName] = true;
        
        // If user has a custom course for the custom subject
        if (userData.customCourses && userData.customCourses['other']) {
          if (!userSelectedCourses[customSubjectName]) {
            userSelectedCourses[customSubjectName] = [];
          }
          userSelectedCourses[customSubjectName].push(userData.customCourses['other']);
          userCustomCourses[customSubjectName] = userData.customCourses['other'];
        }
      }
    }
  } catch (error) {
    console.error("Error getting user's selected courses:", error);
  }

  const subjectTopics = {
    // Generic subject topics
    'Mathematics': ['Algebra', 'Geometry', 'Calculus', 'Statistics', 'Probability', 'Number Theory', 'Discrete Mathematics', 'Linear Algebra'],
    'Science': ['Scientific Method', 'Laboratory Techniques', 'Research Methodology', 'Experimental Design', 'Data Collection'],
    'History': ['Ancient Civilizations', 'Middle Ages', 'Renaissance', 'Industrial Revolution', 'World Wars', 'Cold War', 'Modern History'],
    'Language Arts': ['Literature Analysis', 'Creative Writing', 'Grammar', 'Rhetoric', 'Poetry', 'Non-fiction', 'Drama'],
    'Foreign Languages': ['Grammar', 'Vocabulary', 'Conversation', 'Literature', 'Cultural Studies', 'Translation'],
    'Computer Science': ['Programming', 'Algorithms', 'Data Structures', 'Databases', 'Web Development', 'Networking', 'Cybersecurity'],
    'Art & Design': ['Drawing', 'Painting', 'Sculpture', 'Photography', 'Digital Art', 'Art History', 'Color Theory'],
    'Music': ['Music Theory', 'Music History', 'Composition', 'Performance', 'Instrumental Techniques', 'Musical Analysis'],
    'Physical Education': ['Fitness', 'Sports', 'Nutrition', 'Exercise Science', 'Health', 'Wellness'],
    'Economics': ['Microeconomics', 'Macroeconomics', 'International Trade', 'Economic Policy', 'Market Analysis', 'Financial Systems'],
    'Psychology': ['Cognitive Psychology', 'Developmental Psychology', 'Social Psychology', 'Clinical Psychology', 'Abnormal Psychology', 'Neuroscience'],
    'Engineering': ['Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering', 'Chemical Engineering', 'Software Engineering', 'Materials Science'],
    
    // Math specific courses
    'Algebra': ['Linear Equations', 'Quadratic Equations', 'Polynomials', 'Functions', 'Inequalities', 'Systems of Equations', 'Matrices', 'Logarithms'],
    'Geometry': ['Triangles', 'Circles', 'Polygons', 'Coordinate Geometry', 'Transformations', 'Surface Area', 'Volume', 'Geometric Proofs'],
    'Calculus': ['Limits', 'Derivatives', 'Integrals', 'Sequences', 'Series', 'Vector Calculus', 'Differential Equations', 'Applications'],
    'Statistics': ['Data Analysis', 'Probability', 'Distributions', 'Hypothesis Testing', 'Regression', 'Correlation', 'ANOVA', 'Sampling Methods'],
    'Trigonometry': ['Trigonometric Functions', 'Identities', 'Equations', 'Unit Circle', 'Radians', 'Law of Sines', 'Law of Cosines', 'Polar Coordinates'],
    
    // Science specific courses
    'Biology': ['Cell Biology', 'Genetics', 'Ecology', 'Evolution', 'Anatomy', 'Physiology', 'Botany', 'Zoology', 'Microbiology'],
    'Chemistry': ['Atomic Structure', 'Periodic Table', 'Chemical Bonding', 'Stoichiometry', 'Acids and Bases', 'Thermochemistry', 'Organic Chemistry'],
    'Physics': ['Mechanics', 'Electricity', 'Magnetism', 'Thermodynamics', 'Optics', 'Quantum Mechanics', 'Relativity', 'Wave Phenomena'],
    'Environmental Science': ['Ecosystems', 'Climate Change', 'Pollution', 'Conservation', 'Natural Resources', 'Sustainability', 'Biodiversity'],
    'Astronomy': ['Solar System', 'Stars', 'Galaxies', 'Cosmology', 'Telescopes', 'Space Exploration', 'Celestial Mechanics', 'Black Holes'],
    
    // History specific courses
    'World History': ['Ancient Civilizations', 'Middle Ages', 'Renaissance', 'Age of Exploration', 'Industrial Revolution', 'World Wars', 'Cold War', 'Globalization'],
    'US History': ['Colonial America', 'American Revolution', 'Civil War', 'Reconstruction', 'Great Depression', 'Civil Rights Movement', 'Cold War', 'Modern America'],
    'European History': ['Ancient Greece and Rome', 'Medieval Europe', 'Renaissance', 'Enlightenment', 'French Revolution', 'Industrial Revolution', 'World Wars', 'European Union'],
    'Ancient Civilizations': ['Mesopotamia', 'Egypt', 'Greece', 'Rome', 'China', 'India', 'Maya', 'Inca', 'Aztec'],
    'Modern History': ['World War I', 'Interwar Period', 'World War II', 'Cold War', 'Decolonization', 'Globalization', 'Information Age', 'Contemporary Issues'],
    
    // Computer Science specific courses
    'Programming': ['Fundamentals', 'Data Types', 'Control Structures', 'Functions', 'Object-Oriented Programming', 'Algorithms', 'Problem Solving', 'Debugging'],
    'Web Development': ['HTML', 'CSS', 'JavaScript', 'DOM Manipulation', 'Front-end Frameworks', 'Backend Development', 'APIs', 'Responsive Design'],
    'Database Systems': ['Relational Databases', 'SQL', 'NoSQL', 'Database Design', 'Normalization', 'Transactions', 'Indexing', 'Query Optimization'],
    'Artificial Intelligence': ['Machine Learning', 'Neural Networks', 'Natural Language Processing', 'Computer Vision', 'Expert Systems', 'Robotics', 'Ethics in AI'],
    'Cybersecurity': ['Network Security', 'Encryption', 'Authentication', 'Vulnerability Assessment', 'Ethical Hacking', 'Security Policies', 'Digital Forensics'],
    
    // Engineering specific courses
    'Mechanical Engineering': ['Statics', 'Dynamics', 'Thermodynamics', 'Fluid Mechanics', 'Materials Science', 'Machine Design', 'Heat Transfer', 'Manufacturing Processes'],
    'Electrical Engineering': ['Circuit Analysis', 'Digital Logic', 'Electronics', 'Signal Processing', 'Control Systems', 'Power Systems', 'Electromagnetics'],
    'Civil Engineering': ['Structural Analysis', 'Geotechnical Engineering', 'Transportation Engineering', 'Environmental Engineering', 'Hydraulics', 'Construction Management'],
    'Chemical Engineering': ['Mass Transfer', 'Heat Transfer', 'Fluid Mechanics', 'Thermodynamics', 'Reaction Kinetics', 'Process Control', 'Plant Design'],
    'Software Engineering': ['Software Development Life Cycle', 'Requirements Engineering', 'Software Design', 'Testing', 'Maintenance', 'Project Management', 'DevOps'],
    
    // Language specific courses
    'Spanish': ['Grammar', 'Vocabulary', 'Conversation', 'Reading Comprehension', 'Hispanic Literature', 'Spanish Culture', 'Spanish History'],
    'French': ['Grammar', 'Vocabulary', 'Conversation', 'Reading Comprehension', 'French Literature', 'French Culture', 'French History'],
    'German': ['Grammar', 'Vocabulary', 'Conversation', 'Reading Comprehension', 'German Literature', 'German Culture', 'German History'],
    'Chinese': ['Characters', 'Pronunciation', 'Grammar', 'Vocabulary', 'Conversation', 'Chinese Culture', 'Chinese History'],
    'Japanese': ['Hiragana/Katakana', 'Kanji', 'Grammar', 'Vocabulary', 'Conversation', 'Japanese Culture', 'Japanese History'],
    
    // Economics specific courses
    'Microeconomics': ['Supply and Demand', 'Consumer Theory', 'Producer Theory', 'Market Structures', 'Game Theory', 'Market Failures', 'Resource Allocation'],
    'Macroeconomics': ['National Income', 'Economic Growth', 'Inflation', 'Unemployment', 'Monetary Policy', 'Fiscal Policy', 'International Trade'],
    'International Economics': ['Trade Theory', 'Trade Policy', 'Exchange Rates', 'Balance of Payments', 'Economic Integration', 'Global Finance'],
    'Business Economics': ['Market Analysis', 'Pricing Strategies', 'Competitive Strategy', 'Risk Management', 'Decision Making', 'Economic Forecasting'],
    'Financial Economics': ['Asset Pricing', 'Portfolio Theory', 'Corporate Finance', 'Financial Markets', 'Options and Futures', 'Financial Risk Management'],
    
    // Psychology specific courses
    'Clinical Psychology': ['Psychological Assessment', 'Psychotherapy', 'Mental Disorders', 'Treatment Planning', 'Ethical Issues', 'Evidence-Based Practice'],
    'Cognitive Psychology': ['Perception', 'Attention', 'Memory', 'Language', 'Problem Solving', 'Decision Making', 'Cognitive Neuroscience'],
    'Developmental Psychology': ['Child Development', 'Adolescence', 'Adulthood', 'Aging', 'Cognitive Development', 'Social Development', 'Moral Development'],
    'Social Psychology': ['Social Cognition', 'Attitudes', 'Group Behavior', 'Interpersonal Relations', 'Conformity', 'Obedience', 'Persuasion'],
    'Abnormal Psychology': ['Classification of Disorders', 'Anxiety Disorders', 'Mood Disorders', 'Personality Disorders', 'Schizophrenia', 'Treatment Approaches']
  };
  
  // IMPROVED CUSTOM SUBJECT HANDLING: Check if this is a custom subject
  if (userCustomSubjects[subject]) {
    // For custom subjects, use the associated custom course topics or create appropriate ones
    if (userCustomCourses[subject]) {
      // Generate relevant topics based on the custom course name
      const customCourseName = userCustomCourses[subject];
      const customTopics = generateTopicsForCustomCourse(customCourseName);
      const randomIndex = Math.floor(Math.random() * customTopics.length);
      return customTopics[randomIndex];
    } else {
      // For custom subjects without specific courses, use general educational topics
      const generalTopics = ['Fundamentals', 'Key Concepts', 'Advanced Topics', 'Research Methods', 'Applications', 'History and Development', 'Current Trends', 'Case Studies'];
      const randomIndex = Math.floor(Math.random() * generalTopics.length);
      return generalTopics[randomIndex];
    }
  }
  
  // Check if this is a category subject (like Engineering) and user has selected specific courses within that category
  if (subject === 'Engineering' && userSelectedCourses.Engineering && userSelectedCourses.Engineering.length > 0) {
    // Only use topics from the specific engineering courses the user selected
    let availableTopics = [];
    
    // Collect topics only from the selected engineering courses
    userSelectedCourses.Engineering.forEach(course => {
      if (subjectTopics[course]) {
        availableTopics = availableTopics.concat(subjectTopics[course]);
      }
    });
    
    // If we found topics for the selected courses, use those
    if (availableTopics.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableTopics.length);
      return availableTopics[randomIndex];
    }
  }
  
  // Apply the same logic for other subject categories
  for (const [categoryName, courses] of Object.entries(userSelectedCourses)) {
    if (subject === categoryName && courses.length > 0) {
      let availableTopics = [];
      
      courses.forEach(course => {
        // Handle custom courses specially
        if (course === userCustomCourses[categoryName]) {
          const customTopics = generateTopicsForCustomCourse(course);
          availableTopics = availableTopics.concat(customTopics);
        } else if (subjectTopics[course]) {
          availableTopics = availableTopics.concat(subjectTopics[course]);
        }
      });
      
      if (availableTopics.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableTopics.length);
        return availableTopics[randomIndex];
      }
    }
  }
  
  // First check if we have specific topics for this exact subject
  if (subjectTopics[subject]) {
    const topics = subjectTopics[subject];
    const randomIndex = Math.floor(Math.random() * topics.length);
    return topics[randomIndex];
  }
  
  // If this is an engineering subject but not one of our specific engineering courses
  if (subject.includes('Engineering')) {
    // Get only the appropriate engineering topics
    let engineeringType = '';
    
    if (subject.includes('Mechanical')) {
      engineeringType = 'Mechanical Engineering';
    } else if (subject.includes('Electrical')) {
      engineeringType = 'Electrical Engineering';
    } else if (subject.includes('Civil')) {
      engineeringType = 'Civil Engineering';
    } else if (subject.includes('Chemical')) {
      engineeringType = 'Chemical Engineering';
    } else if (subject.includes('Software')) {
      engineeringType = 'Software Engineering';
    } else {
      // Default to general Engineering topics
      engineeringType = 'Engineering';
    }
    
    // Use the appropriate topics list
    const topics = subjectTopics[engineeringType] || subjectTopics['Engineering'];
    const randomIndex = Math.floor(Math.random() * topics.length);
    return topics[randomIndex];
  }
  
  // For any other subject, use a generic list
  const defaultTopics = ['Fundamentals', 'Advanced Concepts', 'Applied Methods', 'Current Research', 'Historical Development', 'Problem Solving', 'Case Studies', 'Theoretical Approaches'];
  const randomIndex = Math.floor(Math.random() * defaultTopics.length);
  return defaultTopics[randomIndex];
};

// Helper function to generate relevant topics for a custom course
function generateTopicsForCustomCourse(courseName) {
  // Default topics that work for any subject
  const defaultTopics = ['Fundamentals', 'Key Concepts', 'Advanced Topics', 'Research Methods', 'Historical Development', 'Current Trends'];
  
  // Keywords to look for in the course name to generate more specific topics
  const keywords = {
    // Technical fields
    'programming': ['Algorithms', 'Data Structures', 'Software Design', 'Development Methodologies', 'Debugging Techniques'],
    'coding': ['Syntax', 'Best Practices', 'Code Architecture', 'Testing', 'Frameworks'],
    'software': ['Development Life Cycle', 'Requirements', 'Design Patterns', 'Quality Assurance', 'Maintenance'],
    'web': ['Front-end', 'Back-end', 'User Experience', 'Responsive Design', 'Web Services'],
    'data': ['Data Analysis', 'Data Visualization', 'Data Cleaning', 'Big Data', 'Statistical Methods'],
    'design': ['User Interface', 'User Experience', 'Visual Elements', 'Prototyping', 'Design Thinking'],
    'engineering': ['Problem Solving', 'Analysis', 'Technical Specifications', 'Quality Control', 'Systems Thinking'],
    
    // Science fields
    'biology': ['Cell Biology', 'Genetics', 'Ecology', 'Evolution', 'Physiology'],
    'chemistry': ['Atomic Structure', 'Reactions', 'Compounds', 'Laboratory Techniques', 'Chemical Properties'],
    'physics': ['Mechanics', 'Electromagnetism', 'Thermodynamics', 'Quantum Physics', 'Relativity'],
    
    // Business fields
    'business': ['Strategy', 'Operations', 'Marketing', 'Finance', 'Organizational Behavior'],
    'management': ['Leadership', 'Team Building', 'Decision Making', 'Project Management', 'Conflict Resolution'],
    'marketing': ['Market Analysis', 'Consumer Behavior', 'Digital Marketing', 'Brand Management', 'Marketing Strategies'],
    'finance': ['Financial Analysis', 'Investment', 'Risk Management', 'Financial Planning', 'Market Trends'],
    
    // Arts & Humanities
    'art': ['Techniques', 'Art History', 'Composition', 'Color Theory', 'Art Criticism'],
    'music': ['Music Theory', 'Performance', 'Composition', 'Music History', 'Instrumental Techniques'],
    'literature': ['Literary Analysis', 'Creative Writing', 'Literary Genres', 'Critical Theory', 'Cultural Context'],
    'history': ['Historical Analysis', 'Primary Sources', 'Causation', 'Historical Context', 'Historiography'],
    'philosophy': ['Logic', 'Ethics', 'Metaphysics', 'Epistemology', 'Philosophical Arguments'],
    
    // Languages
    'language': ['Grammar', 'Vocabulary', 'Conversation', 'Writing', 'Cultural Context'],
    'spanish': ['Spanish Grammar', 'Vocabulary Building', 'Conversational Spanish', 'Hispanic Culture', 'Reading Comprehension'],
    'french': ['French Grammar', 'Vocabulary Building', 'Conversational French', 'French Culture', 'Reading Comprehension'],
    'german': ['German Grammar', 'Vocabulary Building', 'Conversational German', 'German Culture', 'Reading Comprehension'],
    'chinese': ['Chinese Characters', 'Pronunciation', 'Grammar Patterns', 'Chinese Culture', 'Conversational Skills'],
    'japanese': ['Japanese Writing Systems', 'Grammar Structures', 'Vocabulary', 'Japanese Culture', 'Conversational Skills']
  };
  
  // Check if the course name contains any of our keywords and add specific topics
  const courseLower = courseName.toLowerCase();
  let specificTopics = [];
  
  for (const [keyword, topics] of Object.entries(keywords)) {
    if (courseLower.includes(keyword)) {
      specificTopics = specificTopics.concat(topics);
    }
  }
  
  // If we found specific topics, return those plus some default ones
  if (specificTopics.length > 0) {
    // Add course name to some of the topics to make them more specific
    const customizedTopics = specificTopics.map((topic, index) => 
      index % 2 === 0 ? `${topic} in ${courseName}` : topic
    );
    
    // Return a mix of customized specific topics and default topics
    return [...customizedTopics, ...defaultTopics];
  }
  
  // If no specific topics found, generate generic ones based on the course name
  return [
    `Introduction to ${courseName}`,
    `${courseName} Fundamentals`,
    `Advanced ${courseName}`,
    `${courseName} Theory`,
    `Applied ${courseName}`,
    `${courseName} Analysis`,
    `Current Trends in ${courseName}`,
    `${courseName} Research Methods`,
    ...defaultTopics
  ];
}