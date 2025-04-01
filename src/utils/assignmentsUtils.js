// Assignment utility functions for AdaptIQ

import { getSubjectImageUrl } from './subjectImageUtils';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI with the API key
// In production, this should be properly handled with environment variables
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Function to generate an assignment using Gemini AI
export const generateAssignmentWithGemini = async (subject, topic, type = 'assignment') => {
  try {
    // Prepare the prompt for Gemini
    const prompt = prepareGeminiPrompt(subject, topic, type);
    
    if (!API_KEY) {
      console.warn("API key not found, using fallback assignment generation");
      // Fall back to local generation if no API key
      const mockDueDate = new Date();
      mockDueDate.setDate(mockDueDate.getDate() + Math.floor(Math.random() * 7) + 1);
      return generateAssignment(subject, mockDueDate);
    }
    
    // Call Gemini API
    const content = await model.generateContent(prompt);
    const response = content.response.text();
    
    // Parse the response to extract relevant information
    const assignmentData = parseGeminiResponse(response, subject, topic);
    
    // Set due date (random day within next week)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 7) + 1);
    
    // Generate resources
    const category = getCategoryForSubject(subject);
    const resources = generateMockResources(subject, category);
    
    // Create and return the assignment object
    return {
      id: `assignment-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: assignmentData.title,
      subject: subject,
      category: category,
      description: assignmentData.description,
      dueDate: dueDate.toISOString(),
      createdDate: new Date().toISOString(),
      estimatedMinutes: assignmentData.estimatedMinutes,
      imageUrl: getSubjectImageUrl(subject, category),
      status: 'pending',
      priority: calculatePriority(dueDate),
      resources: resources
    };
  } catch (error) {
    console.error("Error generating assignment with Gemini:", error);
    // Fall back to local generation
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + Math.floor(Math.random() * 7) + 1);
    return generateAssignment(subject, fallbackDate);
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
    const timeValue = parseInt(timeMatch[1]);
    const timeUnit = timeMatch[3].toLowerCase();
    
    if (timeUnit.includes('hour')) {
      estimatedMinutes = timeValue * 60;
    } else {
      estimatedMinutes = timeValue;
    }
    
    // Keep estimated time reasonable (between 15-120 minutes)
    estimatedMinutes = Math.max(15, Math.min(120, estimatedMinutes));
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
    'Other': 'music',

    'Fitness': 'physical',
    'Sports': 'physical',
    'Nutrition': 'physical',
    'Wellness': 'physical'
  };
  
  return categoryMapping[subject] || 'other';
};

// The existing generateAssignment function will be kept as a fallback
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
    ]
  };
  


  // Get topic based on subject
  const getRandomTopic = (subject) => {
    const topics = {
      'Mathematics': ['algebra', 'geometry', 'statistics', 'trigonometry', 'calculus'],
      'Algebra': ['quadratic equations', 'matrices', 'linear functions', 'logarithms', 'inequalities'],
      'Geometry': ['triangles', 'circles', 'polygons', 'transformations', 'coordinate geometry'],
      'Calculus': ['derivatives', 'integrals', 'limits', 'series', 'differential equations'],
      'Statistics': ['probability distributions', 'hypothesis testing', 'regression analysis', 'data visualization'],
      'Trigonometry': ['sine and cosine laws', 'trigonometric identities', 'radian measure', 'periodic functions'],
      'Science': ['scientific method', 'measurement', 'experimentation', 'data analysis'],
      'Physics': ['mechanics', 'thermodynamics', 'electromagnetism', 'quantum physics', 'optics', 'fluid dynamics'],
      'Chemistry': ['chemical bonding', 'stoichiometry', 'thermochemistry', 'organic compounds', 'acids and bases', 'redox reactions'],
      'Biology': ['cell biology', 'genetics', 'ecology', 'human physiology', 'evolution', 'microbiology'],
      'Environmental Science': ['ecosystems', 'climate change', 'conservation', 'sustainability', 'pollution'],
      'Astronomy': ['solar system', 'stars', 'galaxies', 'cosmology', 'space exploration'],
      'History': ['renaissance', 'industrial revolution', 'cold war', 'civil rights movement', 'ancient empires'],
      'World History': ['ancient civilizations', 'world wars', 'colonialism', 'political systems', 'cultural revolutions'],
      'US History': ['american revolution', 'civil war', 'great depression', 'civil rights', 'cold war era'],
      'European History': ['medieval europe', 'renaissance', 'french revolution', 'world war I', 'world war II'],
      'Ancient Civilizations': ['mesopotamia', 'egypt', 'greece', 'rome', 'china'],
      'Modern History': ['industrial revolution', 'world wars', 'cold war', 'globalization', 'information age'],
      'Language': ['grammar', 'composition', 'literature analysis', 'creative writing', 'rhetoric'],
      'English': ['literature analysis', 'grammar', 'composition', 'creative writing', 'rhetoric'],
      'Spanish': ['verb conjugation', 'conversational spanish', 'grammar', 'cultural studies', 'literature'],
      'French': ['verb tenses', 'vocabulary building', 'conversational french', 'grammar', 'cultural exploration'],
      'German': ['sentence structure', 'modal verbs', 'grammar', 'vocabulary building', 'cultural context'],
      'Chinese': ['character writing', 'pronunciation', 'grammar patterns', 'conversational mandarin', 'cultural elements'],
      'Japanese': ['kana and kanji', 'sentence structure', 'honorifics', 'conversational phrases', 'cultural context'],
      'Computer Science': ['algorithms', 'data structures', 'programming paradigms', 'computer architecture', 'software engineering'],
      'Programming': ['data structures', 'algorithms', 'object-oriented programming', 'web development', 'databases', 'functional programming'],
      'Web Development': ['responsive design', 'frontend frameworks', 'API integration', 'server-side rendering', 'web security', 'performance optimization'],
      'Database Systems': ['relational databases', 'SQL', 'NoSQL', 'data modeling', 'database optimization'],
      'Artificial Intelligence': ['machine learning', 'neural networks', 'natural language processing', 'computer vision', 'reinforcement learning'],
      'Cybersecurity': ['network security', 'cryptography', 'ethical hacking', 'digital forensics', 'security protocols'],
      'General Psychology': ['cognitive processes', 'developmental stages', 'psychological disorders', 'research methods', 'social psychology'],
      'Speech & Debate': ['public speaking', 'argumentation', 'persuasive techniques', 'debate formats', 'critical thinking'],
      'Mechanical Engineering': ['thermodynamics', 'fluid mechanics', 'machine design', 'materials science', 'robotics'],
      'Electrical Engineering': ['circuit analysis', 'electromagnetism', 'power systems', 'control systems', 'signal processing'],
      'Civil Engineering': ['structural analysis', 'geo-technical engineering', 'transportation engineering', 'construction materials', 'hydraulics'],
      'Chemical Engineering': ['reaction engineering', 'process control', 'thermodynamics', 'polymer science', 'biochemical engineering'],
      'Software Engineering': ['software development life cycle', 'design patterns', 'version control', 'software testing', 'agile methodologies'],
      'Microeconomics': ['supply and demand', 'market structures', 'consumer behavior', 'game theory', 'price elasticity'],
      'Macroeconomics': ['GDP and inflation', 'monetary policy', 'fiscal policy', 'economic growth', 'international trade'],
      'International Economics': ['exchange rates', 'global trade policies', 'balance of payments', 'foreign direct investment', 'comparative advantage'],
      'Business Economics': ['corporate finance', 'market analysis', 'pricing strategies', 'business cycles', 'economic forecasting'],
      'Financial Economics': ['risk management', 'investment analysis', 'derivatives', 'portfolio theory', 'behavioral finance'],
      'Clinical Psychology': ['psychotherapy techniques', 'diagnostic assessment', 'mental health disorders', 'treatment modalities', 'counseling methods'],
      'Cognitive Psychology': ['memory processes', 'decision making', 'language acquisition', 'perception', 'problem-solving'],
      'Developmental Psychology': ['lifespan development', 'child psychology', 'adolescent development', 'aging and cognition', 'attachment theory'],
      'Social Psychology': ['group behavior', 'persuasion techniques', 'attitudes and biases', 'social identity', 'interpersonal relationships'],
      'Abnormal Psychology': ['mood disorders', 'schizophrenia', 'anxiety disorders', 'personality disorders', 'psychopathology'],
      'Drawing': ['perspective drawing', 'shading techniques', 'figure drawing', 'composition', 'gesture sketching'],
      'Painting': ['color theory', 'acrylic techniques', 'watercolor techniques', 'oil painting', 'abstract painting'],
      'Sculpture': ['clay modeling', 'carving techniques', 'casting methods', '3D composition', 'mixed media sculpture'],
      'Digital Art': ['graphic design', 'vector illustration', 'digital painting', 'animation basics', 'concept art'],
      'Music Theory': ['notation and rhythm', 'chord progressions', 'scales and modes', 'harmony', 'ear training'],
      'Instrumental': ['piano techniques', 'guitar basics', 'orchestration', 'wind instruments', 'percussion studies'],
      'Vocal': ['breath control', 'pitch and tone', 'vocal warm-ups', 'song interpretation', 'choral singing'],
      'Fitness': ['strength training', 'cardiovascular health', 'flexibility exercises', 'workout planning', 'injury prevention'],
      'Sports': ['team sports strategies', 'individual sports techniques', 'sports psychology', 'athletic training', 'game rules'],
      'Nutrition': ['macronutrients', 'meal planning', 'sports nutrition', 'dietary supplements', 'food science'],
      'Wellness': ['mental health awareness', 'stress management', 'sleep hygiene', 'mindfulness techniques', 'holistic health'],
  
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
    'Other': 'music',

    'Fitness': 'physical',
    'Sports': 'physical',
    'Nutrition': 'physical',
    'Wellness': 'physical'
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
export const ensureWeeklyAssignments = async (subjects) => {
  // Get existing assignments (don't overwrite them)
  let assignments = getAssignments();
  const now = new Date();
  const oneWeekLater = new Date(now);
  oneWeekLater.setDate(oneWeekLater.getDate() + 7);
  
  // Store promises for all assignment generations
  const assignmentPromises = [];
  
  // Check each subject and create an assignment if none exists
  for (const subject of subjects) {
    const hasAssignmentThisWeek = assignments.some(assignment => {
      return assignment.subject === subject && 
             new Date(assignment.dueDate) <= oneWeekLater &&
             new Date(assignment.dueDate) >= now &&
             assignment.status !== 'completed';
    });
    
    if (!hasAssignmentThisWeek) {
      // Get topic based on subject
      const topic = getRandomTopicForSubject(subject);
      
      // Generate assignment types randomly
      const assignmentTypes = ['assignment', 'quiz', 'project'];
      const randomType = assignmentTypes[Math.floor(Math.random() * assignmentTypes.length)];
      
      // Add the promise to our array
      assignmentPromises.push(
        generateAssignmentWithGemini(subject, topic, randomType)
          .catch(error => {
            console.error(`Error generating assignment for ${subject}:`, error);
            // Fall back to local generation if API fails
            const dueDate = new Date(now);
            dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 7) + 1);
            return generateAssignment(subject, dueDate);
          })
      );
    }
  }
  
  // Wait for all assignment generations to complete
  const newAssignments = await Promise.all(assignmentPromises);
  
  // Add new assignments to the existing ones
  assignments = [...assignments, ...newAssignments];
  
  // Update and save assignments
  assignments = assignments.map(updateAssignmentStatus);
  saveAssignments(assignments);
  
  return assignments;
};

// Export helper function to get a random topic for a subject
export const getRandomTopicForSubject = (subject) => {
  const topics = {
    'Mathematics': ['algebra', 'geometry', 'statistics', 'trigonometry', 'calculus'],
    'Algebra': ['quadratic equations', 'matrices', 'linear functions', 'logarithms', 'inequalities'],
    'Geometry': ['triangles', 'circles', 'polygons', 'transformations', 'coordinate geometry'],
    'Calculus': ['derivatives', 'integrals', 'limits', 'series', 'differential equations'],
    'Statistics': ['probability distributions', 'hypothesis testing', 'regression analysis', 'data visualization'],
    'Trigonometry': ['sine and cosine laws', 'trigonometric identities', 'radian measure', 'periodic functions'],
    'Science': ['scientific method', 'measurement', 'experimentation', 'data analysis'],
    'Physics': ['mechanics', 'thermodynamics', 'electromagnetism', 'quantum physics', 'optics', 'fluid dynamics'],
    'Chemistry': ['chemical bonding', 'stoichiometry', 'thermochemistry', 'organic compounds', 'acids and bases', 'redox reactions'],
    'Biology': ['cell biology', 'genetics', 'ecology', 'human physiology', 'evolution', 'microbiology'],
    'Environmental Science': ['ecosystems', 'climate change', 'conservation', 'sustainability', 'pollution'],
    'Astronomy': ['solar system', 'stars', 'galaxies', 'cosmology', 'space exploration'],
    'History': ['renaissance', 'industrial revolution', 'cold war', 'civil rights movement', 'ancient empires'],
    'World History': ['ancient civilizations', 'world wars', 'colonialism', 'political systems', 'cultural revolutions'],
    'US History': ['american revolution', 'civil war', 'great depression', 'civil rights', 'cold war era'],
    'European History': ['medieval europe', 'renaissance', 'french revolution', 'world war I', 'world war II'],
    'Ancient Civilizations': ['mesopotamia', 'egypt', 'greece', 'rome', 'china'],
    'Modern History': ['industrial revolution', 'world wars', 'cold war', 'globalization', 'information age'],
    'Language': ['grammar', 'composition', 'literature analysis', 'creative writing', 'rhetoric'],
    'English': ['literature analysis', 'grammar', 'composition', 'creative writing', 'rhetoric'],
    'Spanish': ['verb conjugation', 'conversational spanish', 'grammar', 'cultural studies', 'literature'],
    'French': ['verb tenses', 'vocabulary building', 'conversational french', 'grammar', 'cultural exploration'],
    'German': ['sentence structure', 'modal verbs', 'grammar', 'vocabulary building', 'cultural context'],
    'Chinese': ['character writing', 'pronunciation', 'grammar patterns', 'conversational mandarin', 'cultural elements'],
    'Japanese': ['kana and kanji', 'sentence structure', 'honorifics', 'conversational phrases', 'cultural context'],
    'Computer Science': ['algorithms', 'data structures', 'programming paradigms', 'computer architecture', 'software engineering'],
    'Programming': ['data structures', 'algorithms', 'object-oriented programming', 'web development', 'databases', 'functional programming'],
    'Web Development': ['responsive design', 'frontend frameworks', 'API integration', 'server-side rendering', 'web security', 'performance optimization'],
    'Database Systems': ['relational databases', 'SQL', 'NoSQL', 'data modeling', 'database optimization'],
    'Artificial Intelligence': ['machine learning', 'neural networks', 'natural language processing', 'computer vision', 'reinforcement learning'],
    'Cybersecurity': ['network security', 'cryptography', 'ethical hacking', 'digital forensics', 'security protocols'],
    'General Psychology': ['cognitive processes', 'developmental stages', 'psychological disorders', 'research methods', 'social psychology'],
    'Speech & Debate': ['public speaking', 'argumentation', 'persuasive techniques', 'debate formats', 'critical thinking'],
    'Mechanical Engineering': ['thermodynamics', 'fluid mechanics', 'machine design', 'materials science', 'robotics'],
    'Electrical Engineering': ['circuit analysis', 'electromagnetism', 'power systems', 'control systems', 'signal processing'],
    'Civil Engineering': ['structural analysis', 'geotechnical engineering', 'transportation engineering', 'construction materials', 'hydraulics'],
    'Chemical Engineering': ['reaction engineering', 'process control', 'thermodynamics', 'polymer science', 'biochemical engineering'],
    'Software Engineering': ['software development life cycle', 'design patterns', 'version control', 'software testing', 'agile methodologies'],
    'Microeconomics': ['supply and demand', 'market structures', 'consumer behavior', 'game theory', 'price elasticity'],
    'Macroeconomics': ['GDP and inflation', 'monetary policy', 'fiscal policy', 'economic growth', 'international trade'],
    'International Economics': ['exchange rates', 'global trade policies', 'balance of payments', 'foreign direct investment', 'comparative advantage'],
    'Business Economics': ['corporate finance', 'market analysis', 'pricing strategies', 'business cycles', 'economic forecasting'],
    'Financial Economics': ['risk management', 'investment analysis', 'derivatives', 'portfolio theory', 'behavioral finance'],
    'Clinical Psychology': ['psychotherapy techniques', 'diagnostic assessment', 'mental health disorders', 'treatment modalities', 'counseling methods'],
    'Cognitive Psychology': ['memory processes', 'decision making', 'language acquisition', 'perception', 'problem-solving'],
    'Developmental Psychology': ['lifespan development', 'child psychology', 'adolescent development', 'aging and cognition', 'attachment theory'],
    'Social Psychology': ['group behavior', 'persuasion techniques', 'attitudes and biases', 'social identity', 'interpersonal relationships'],
    'Abnormal Psychology': ['mood disorders', 'schizophrenia', 'anxiety disorders', 'personality disorders', 'psychopathology'],
    'Drawing': ['perspective drawing', 'shading techniques', 'figure drawing', 'composition', 'gesture sketching'],
    'Painting': ['color theory', 'acrylic techniques', 'watercolor techniques', 'oil painting', 'abstract painting'],
    'Sculpture': ['clay modeling', 'carving techniques', 'casting methods', '3D composition', 'mixed media sculpture'],
    'Digital Art': ['graphic design', 'vector illustration', 'digital painting', 'animation basics', 'concept art'],
    'Music Theory': ['notation and rhythm', 'chord progressions', 'scales and modes', 'harmony', 'ear training'],
    'Instrumental': ['piano techniques', 'guitar basics', 'orchestration', 'wind instruments', 'percussion studies'],
    'Vocal': ['breath control', 'pitch and tone', 'vocal warm-ups', 'song interpretation', 'choral singing'],
    'Fitness': ['strength training', 'cardiovascular health', 'flexibility exercises', 'workout planning', 'injury prevention'],
    'Sports': ['team sports strategies', 'individual sports techniques', 'sports psychology', 'athletic training', 'game rules'],
    'Nutrition': ['macronutrients', 'meal planning', 'sports nutrition', 'dietary supplements', 'food science'],
    'Wellness': ['mental health awareness', 'stress management', 'sleep hygiene', 'mindfulness techniques', 'holistic health'],

    
  };
  
  // Try to get topics for the exact subject
  if (topics[subject] && topics[subject].length > 0) {
    return topics[subject][Math.floor(Math.random() * topics[subject].length)];
  }
  
  // Try to find a similar subject if exact match not found
  const similarSubject = Object.keys(topics).find(key => 
    subject.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(subject.toLowerCase())
  );
  
  if (similarSubject && topics[similarSubject].length > 0) {
    return topics[similarSubject][Math.floor(Math.random() * topics[similarSubject].length)];
  }
  
  // Fall back to default topics
  const defaultTopics = ['fundamental concepts', 'basic principles', 'problem solving', 'theoretical applications', 'practical applications'];
  return defaultTopics[Math.floor(Math.random() * defaultTopics.length)];
};