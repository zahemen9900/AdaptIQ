// Assignment utility functions for AdaptIQ
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth, db } from '../../firebase';
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
      return [];
    }

    const userRef = doc(db, "users", auth.currentUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.warn("User document not found");
      return [];
    }

    const userData = userSnap.data();
    
    // First try to get subjects directly if available
    if (userData.subjects && userData.subjects.length > 0) {
      const subjectLabels = userData.subjects.map(subjectId => {
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
        return subjectMap[subjectId] || subjectId;
      });
      return subjectLabels;
    }

    // If no subjects directly, try to extract from courses
    if (userData.courses && userData.courses.length > 0) {
      const subjectSet = new Set();
      
      userData.courses.forEach(courseId => {
        const parts = courseId.split('-');
        const subjectId = parts[0];
        
        const subjectMap = {
          'math': 'Mathematics',
          'algebra': 'Algebra',
          'geometry': 'Geometry', 
          'calculus': 'Calculus',
          'science': 'Science',
          'biology': 'Biology',
          'chemistry': 'Chemistry',
          'physics': 'Physics',
          'history': 'History',
          'worldHistory': 'World History',
          'language': 'Language Arts',
          'english': 'English',
          'programming': 'Programming',
          'computerScience': 'Computer Science',
          'foreign': 'Foreign Languages',
          'spanish': 'Spanish',
          'french': 'French',
          'art': 'Art & Design',
          'music': 'Music',
          'physical': 'Physical Education',
          'economics': 'Economics',
          'psychology': 'Psychology',
          'engineering': 'Engineering'
        };
        
        subjectSet.add(subjectMap[subjectId] || 'General');
      });
      
      return Array.from(subjectSet);
    }

    // If no subjects or courses, return empty array
    return [];
  } catch (error) {
    console.error("Error fetching user subjects:", error);
    return [];
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

// Save assignments to local storage (will be replaced with Firebase)
export const saveAssignments = (assignments) => {
  try {
    localStorage.setItem('userAssignments', JSON.stringify(assignments));
    return true;
  } catch (error) {
    console.error("Error saving assignments:", error);
    return false;
  }
};

// Get assignments from local storage (will be replaced with Firebase)
export const getAssignments = () => {
  try {
    const assignmentsData = localStorage.getItem('userAssignments');
    if (assignmentsData) {
      const assignments = JSON.parse(assignmentsData);
      return assignments.map(updateAssignmentStatus);
    }
    return [];
  } catch (error) {
    console.error("Error retrieving assignments:", error);
    return [];
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
    
    // 4. Save assignments
    saveAssignments(assignments);
    
    return assignments;
  } catch (error) {
    console.error("Error generating user assignments:", error);
    return [];
  }
};

// Ensure user has assignments - check if there are assignments due within a week
export const ensureUserHasAssignments = async () => {
  // Get existing assignments
  const existingAssignments = getAssignments();
  
  // Check if there are assignments due within the next week
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  
  const hasUpcomingAssignments = existingAssignments.some(assignment => {
    const dueDate = new Date(assignment.dueDate);
    return dueDate > now && dueDate <= nextWeek && assignment.status !== 'completed';
  });
  
  // If there are no assignments due within the next week, generate new ones
  if (!hasUpcomingAssignments || existingAssignments.length === 0) {
    return await generateUserAssignments();
  }
  
  return existingAssignments;
};

// Export helper function to get a random topic for a subject
export const getRandomTopicForSubject = (subject) => {
  const subjectTopics = {
    'Mathematics': ['Algebra', 'Geometry', 'Calculus', 'Statistics', 'Probability', 'Number Theory', 'Discrete Mathematics', 'Linear Algebra'],
    'Algebra': ['Equations', 'Inequalities', 'Functions', 'Polynomials', 'Radical Expressions', 'Rational Expressions', 'Systems of Equations'],
    'Geometry': ['Triangles', 'Circles', 'Polygons', 'Coordinate Geometry', 'Transformations', 'Surface Area and Volume', 'Proofs'],
    'Calculus': ['Limits', 'Derivatives', 'Integrals', 'Differential Equations', 'Vector Calculus', 'Series'],
    'Statistics': ['Probability', 'Data Analysis', 'Hypothesis Testing', 'Regression Analysis', 'Statistical Inference', 'Sampling'],
    'Science': ['Scientific Method', 'Laboratory Techniques', 'Research Methodology', 'Experimental Design', 'Data Collection'],
    'Biology': ['Cell Biology', 'Genetics', 'Ecology', 'Evolution', 'Anatomy', 'Physiology', 'Botany', 'Zoology'],
    'Chemistry': ['Periodic Table', 'Chemical Bonding', 'Stoichiometry', 'Acids and Bases', 'Thermodynamics', 'Organic Chemistry'],
    'Physics': ['Mechanics', 'Electricity', 'Magnetism', 'Thermodynamics', 'Optics', 'Quantum Mechanics', 'Relativity'],
    'History': ['Ancient Civilizations', 'Middle Ages', 'Renaissance', 'Industrial Revolution', 'World Wars', 'Cold War', 'Modern History'],
    'World History': ['Ancient Greece', 'Roman Empire', 'Chinese Dynasties', 'Colonialism', 'World Wars', 'Cold War', 'Globalization'],
    'US History': ['Colonial Period', 'American Revolution', 'Civil War', 'Great Depression', 'Civil Rights Movement', 'Cold War', 'Post 9/11'],
    'Language Arts': ['Literature Analysis', 'Creative Writing', 'Grammar', 'Rhetoric', 'Poetry', 'Non-fiction', 'Drama'],
    'English': ['Literature Analysis', 'Grammar', 'Composition', 'Rhetoric', 'Poetry', 'Drama', 'Novels'],
    'Foreign Languages': ['Grammar', 'Vocabulary', 'Conversation', 'Literature', 'Cultural Studies', 'Translation'],
    'Spanish': ['Grammar', 'Vocabulary', 'Conversation', 'Literature', 'Hispanic Culture', 'Spanish History'],
    'French': ['Grammar', 'Vocabulary', 'Conversation', 'Literature', 'French Culture', 'French History'],
    'German': ['Grammar', 'Vocabulary', 'Conversation', 'Literature', 'German Culture', 'German History'],
    'Computer Science': ['Programming', 'Algorithms', 'Data Structures', 'Databases', 'Web Development', 'Networking', 'Cybersecurity'],
    'Programming': ['Object-Oriented Design', 'Functional Programming', 'Web Development', 'Mobile Apps', 'Algorithms', 'API Design'],
    'Art & Design': ['Drawing', 'Painting', 'Sculpture', 'Photography', 'Digital Art', 'Art History', 'Color Theory'],
    'Music': ['Music Theory', 'Music History', 'Composition', 'Performance', 'Instrumental Techniques', 'Musical Analysis'],
    'Physical Education': ['Fitness', 'Sports', 'Nutrition', 'Exercise Science', 'Health', 'Wellness'],
    'Economics': ['Microeconomics', 'Macroeconomics', 'International Trade', 'Economic Policy', 'Market Analysis', 'Financial Systems'],
    'Psychology': ['Cognitive Psychology', 'Developmental Psychology', 'Social Psychology', 'Clinical Psychology', 'Abnormal Psychology', 'Neuroscience'],
    'Engineering': ['Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering', 'Chemical Engineering', 'Software Engineering', 'Materials Science']
  };
  
  // Get topics for the subject, or use a default list if no specific topics are defined
  const topics = subjectTopics[subject] || 
                ['Fundamentals', 'Advanced Concepts', 'Applied Methods', 'Current Research', 'Historical Development', 'Problem Solving'];
  
  // Randomly select a topic
  const randomIndex = Math.floor(Math.random() * topics.length);
  return topics[randomIndex];
};