// Assignment utility functions for AdaptIQ

import { getSubjectImageUrl } from './subjectImageUtils';

// Mock assignment generation (will be replaced with Gemini API call)
export const generateAssignment = (subject, dueDate, courseLevel = 'intermediate') => {
  // This function will be replaced with Gemini API integration
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
      "Record a podcast discussing different interpretations of {topic}."
    ],
    "computer-science": [
      "Implement an algorithm that solves a problem related to {topic}.",
      "Create a project that demonstrates your understanding of {topic}.",
      "Write a technical paper explaining how {topic} works with practical examples."
    ]
  };

  // Get topic based on subject
  const getRandomTopic = (subject) => {
    const topics = {
      'Algebra': ['quadratic equations', 'matrices', 'linear functions', 'logarithms'],
      'Geometry': ['triangles', 'circles', 'polygons', 'transformations'],
      'Calculus': ['derivatives', 'integrals', 'limits', 'series'],
      'Physics': ['mechanics', 'thermodynamics', 'electromagnetism', 'quantum physics'],
      'Chemistry': ['chemical bonding', 'stoichiometry', 'thermochemistry', 'organic compounds'],
      'Biology': ['cell biology', 'genetics', 'ecology', 'human physiology'],
      'World History': ['ancient civilizations', 'world wars', 'colonialism', 'political systems'],
      'Programming': ['data structures', 'algorithms', 'object-oriented programming', 'web development'],
      'Web Development': ['responsive design', 'frontend frameworks', 'API integration', 'server-side rendering'],
      'General Psychology': ['cognitive processes', 'developmental stages', 'psychological disorders', 'research methods']
    };
    
    return topics[subject] ? 
      topics[subject][Math.floor(Math.random() * topics[subject].length)] : 
      'recent concepts';
  };

  // Map subject to category
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
    'Spanish': 'language',
    'French': 'language',
    'German': 'language',
    'Chinese': 'language',
    'Japanese': 'language',
    'Programming': 'computer-science',
    'Web Development': 'computer-science',
    'Database Systems': 'computer-science',
    'Artificial Intelligence': 'computer-science',
    'Cybersecurity': 'computer-science'
  };
  
  const category = categoryMapping[subject] || 'other';
  const templates = mockAssignmentTemplates[category] || mockAssignmentTemplates.mathematics;
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
    status: 'pending', // 'pending', 'in-progress', 'completed', 'overdue'
    priority: calculatePriority(dueDate),
    resources: generateMockResources(subject, category)
  };
};

// Generate assignments for all subjects
export const generateWeeklyAssignments = (subjects, startDate = new Date()) => {
  const assignments = [];
  const courseLevels = ['beginner', 'intermediate', 'advanced'];

  subjects.forEach((subject, index) => {
    // Distribute due dates throughout the week
    const daysToAdd = index % 7;
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + daysToAdd);
    
    // Get random course level for variety in estimated time
    const courseLevel = courseLevels[Math.floor(Math.random() * courseLevels.length)];
    
    const assignment = generateAssignment(subject, dueDate, courseLevel);
    assignments.push(assignment);
  });

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
    return { ...assignment, status: 'overdue', priority: 5 };
  }
  
  return assignment;
};

// Get formatted date string
export const formatAssignmentDate = (dateString) => {
  const date = new Date(dateString);
  const options = { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleDateString('en-US', options);
};

// Generate mock resources for assignments
const generateMockResources = (subject, category) => {
  const resourceTypes = [
    { type: 'reading', label: 'Reading Materials' },
    { type: 'video', label: 'Video Tutorials' },
    { type: 'practice', label: 'Practice Exercises' }
  ];
  
  // Include 1-3 resources randomly
  const numResources = Math.floor(Math.random() * 3) + 1;
  const resources = [];
  
  for (let i = 0; i < numResources; i++) {
    const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    resources.push({
      id: `resource-${Date.now()}-${Math.floor(Math.random() * 1000)}-${i}`,
      title: `${subject} ${resourceType.label}`,
      type: resourceType.type,
      url: '#', // Will be replaced with actual URLs in production
      label: resourceType.label
    });
  }
  
  return resources;
};

// Sort assignments by priority and date
export const sortAssignments = (assignments, sortBy = 'dueDate') => {
  return [...assignments].sort((a, b) => {
    if (sortBy === 'priority') {
      return b.priority - a.priority;
    }
    
    if (sortBy === 'subject') {
      return a.subject.localeCompare(b.subject);
    }
    
    // Default: sort by dueDate
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
};

// Group assignments by date for calendar view
export const groupAssignmentsByDate = (assignments) => {
  const grouped = {};
  
  assignments.forEach(assignment => {
    const due = new Date(assignment.dueDate);
    const dateKey = due.toISOString().split('T')[0];
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    
    grouped[dateKey].push(assignment);
  });
  
  return grouped;
};

// Generate dates for calendar view
export const generateCalendarDates = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  
  // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = firstDay.getDay();
  
  const days = [];
  
  // Previous month days to show
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      date,
      day: prevMonthLastDay - i,
      isCurrentMonth: false,
      isToday: isSameDay(date, new Date())
    });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    days.push({
      date,
      day: i,
      isCurrentMonth: true,
      isToday: isSameDay(date, new Date())
    });
  }
  
  // Next month days to complete the calendar grid (6 weeks total)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date,
      day: i,
      isCurrentMonth: false,
      isToday: isSameDay(date, new Date())
    });
  }
  
  return days;
};

// Check if two dates are the same day
export const isSameDay = (date1, date2) => {
  return date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();
};

// Filter assignments by various criteria
export const filterAssignments = (assignments, filters) => {
  return assignments.filter(assignment => {
    // Filter by status
    if (filters.status && filters.status !== 'all' && assignment.status !== filters.status) {
      return false;
    }
    
    // Filter by subject
    if (filters.subject && filters.subject !== 'all' && assignment.subject !== filters.subject) {
      return false;
    }
    
    // Filter by search term
    if (filters.searchTerm && !assignment.title.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filter by date range
    if (filters.dateRange) {
      const dueDate = new Date(assignment.dueDate);
      if (filters.dateRange.start && dueDate < new Date(filters.dateRange.start)) {
        return false;
      }
      if (filters.dateRange.end && dueDate > new Date(filters.dateRange.end)) {
        return false;
      }
    }
    
    return true;
  });
};

// Save assignments to local storage (will be replaced with Firebase)
export const saveAssignments = (assignments) => {
  localStorage.setItem('adaptiq-assignments', JSON.stringify(assignments));
};

// Get assignments from local storage (will be replaced with Firebase)
export const getAssignments = () => {
  const assignments = localStorage.getItem('adaptiq-assignments');
  return assignments ? JSON.parse(assignments) : [];
};

// Generate assignments for a subject if there are none due in the next week
export const ensureWeeklyAssignments = (subjects) => {
  let assignments = getAssignments();
  const now = new Date();
  const oneWeekLater = new Date(now);
  oneWeekLater.setDate(oneWeekLater.getDate() + 7);
  
  // Check each subject and create an assignment if none exists
  subjects.forEach(subject => {
    const hasAssignmentThisWeek = assignments.some(assignment => {
      return assignment.subject === subject && 
             new Date(assignment.dueDate) <= oneWeekLater &&
             new Date(assignment.dueDate) >= now &&
             assignment.status !== 'completed';
    });
    
    if (!hasAssignmentThisWeek) {
      // Generate a new assignment with a due date within the next week
      const daysToAdd = Math.floor(Math.random() * 7) + 1;
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + daysToAdd);
      
      const newAssignment = generateAssignment(subject, dueDate);
      assignments.push(newAssignment);
    }
  });
  
  // Update and save assignments
  assignments = assignments.map(updateAssignmentStatus);
  saveAssignments(assignments);
  
  return assignments;
};

// Prepare the integration with Gemini API
export const prepareGeminiPrompt = (subject, topic, type = 'assignment') => {
  // This function will construct prompts for the Gemini API when integrated
  const prompts = {
    assignment: `Create a detailed assignment for a ${subject} course focused on the topic of ${topic}. Include learning objectives, required tasks, evaluation criteria, and estimated completion time.`,
    quiz: `Generate a comprehensive quiz for ${subject} on the topic of ${topic} with a mix of multiple choice, short answer, and essay questions. Include an answer key.`,
    project: `Design a project-based assignment for ${subject} focused on ${topic}. Include project requirements, milestones, deliverables, and assessment criteria.`
  };
  
  return prompts[type] || prompts.assignment;
};

// This function will be implemented when Gemini API is integrated
export const generateAssignmentWithGemini = async (subject, topic, type = 'assignment') => {
  // Placeholder for future Gemini API implementation
  const prompt = prepareGeminiPrompt(subject, topic, type);
  
  // Mock API response for now
  console.log('Gemini API prompt (to be implemented):', prompt);
  
  // Return mock data until API is integrated
  const mockDueDate = new Date();
  mockDueDate.setDate(mockDueDate.getDate() + 7);
  
  return generateAssignment(subject, mockDueDate);
};

// Export all utility functions for use in the application