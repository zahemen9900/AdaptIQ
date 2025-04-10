import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import './CourseLearningPage.css';
import Logo from '../assets/logo-white.png';
import { 
  IconCalendar, IconUser, IconBook, IconSettings, IconChartBar, 
  IconClipboard, IconUsers, IconArrowLeft, IconMessageCircle, 
  IconQuestionMark, IconNotebook, IconSend, IconHistory,
  IconChartLine, IconActivity, IconRefresh, IconPhotoUp,
  IconTrash, IconCheck, IconX, IconDownload, IconExternalLink,
  IconAlertTriangle, IconClock, IconSparkles, IconFileText,
  IconCopy, IconThumbUp, IconThumbDown,
  IconLayoutDashboard // Added for Overview
} from '@tabler/icons-react';
import { getSubjectImageUrl } from '../utils/subjectImageUtils';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { 
  getProgressFromFirebase, 
  updateProgressInFirebase, 
  incrementProgress,
  getActivityHistory,
  recordActivity
} from '../utils/progressTracker';
import {
  saveChatHistory,
  getChatHistory,
  getAllChatHistory,
  clearChatHistory,
  getOrCreateSessionId,
  endCurrentSession,
  getConversationSession,
  forceNewSession,
  updateMessageFeedback
} from '../utils/chatHistoryUtils';
import { getAssignments, formatAssignmentDate } from '../utils/assignmentsUtils';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { auth } from '../../firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useUser } from '../context/UserContext'; // Import useUser
import { useTheme } from '../context/ThemeContext'; // <-- Add this import

// Initialize the Google Generative AI with the API key
// In production, this should be properly handled with environment variables
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Initialize GoogleGenAI for PDF handling (as in gemini-doc.js)
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Animation variants for different components
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      when: "beforeChildren",
      duration: 0.3, // Faster overall animation
      delayChildren: 0.05,
      staggerChildren: 0.03 // Much faster staggering effect
    }
  },
  exit: {
    opacity: 0,
    transition: { 
      when: "afterChildren",
      staggerChildren: 0.02, // Faster exit staggering
      staggerDirection: -1,
      duration: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 400, damping: 20 } // Faster spring motion
  },
  exit: { 
    y: -20, 
    opacity: 0,
    transition: { duration: 0.15 } // Faster exit
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 20,
      duration: 0.2 // Quick spring motion
    }
  },
  hover: { y: -10, transition: { duration: 0.2 } } // Quick hover motion
};

const resourceCardVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { type: "spring", stiffness: 400, damping: 20, duration: 0.2 } // Faster animation
  },
  hover: { 
    scale: 1.03,
    boxShadow: "0px 5px 15px rgba(0,0,0,0.1)",
    transition: { duration: 0.15 } // Faster hover
  },
  tap: { scale: 0.98 },
  exit: { 
    scale: 0.95,
    opacity: 0,
    transition: { duration: 0.15 } // Faster exit
  }
};

const CourseLearningPage = () => {
  const { courseId } = useParams();
  const courseName = decodeURIComponent(courseId);
  const { user } = useUser(); // Get user data from context
  const { isDarkMode } = useTheme(); // <-- Get theme state
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState('');
  const [mode, setMode] = useState('select'); // 'select', 'chat', 'quiz', 'resources'
  const [courseImage, setCourseImage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activityHistory, setActivityHistory] = useState([]);
  const [showProgressPopup, setShowProgressPopup] = useState(false);
  const [progressAnimation, setProgressAnimation] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(false);
  const fileInputRef = useRef(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const chatEndRef = useRef(null); // Add this ref for scrolling
  
  // New state for course assignments
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [courseAssignments, setCourseAssignments] = useState([]);
  
  // State to track whether user data is loaded from Firebase
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);

  // State for confirmation modal
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);

  // Add these additional state variables after the other state declarations
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackMessageId, setFeedbackMessageId] = useState(null);
  const [showFeedbackThanks, setShowFeedbackThanks] = useState(false);

  // Add these additional state variables after the existing state declarations
  const [likedMessages, setLikedMessages] = useState({});
  const [dislikedMessages, setDislikedMessages] = useState({});
  const [showLikeThanks, setShowLikeThanks] = useState(false);

  // Check for Firebase authentication status
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsUserAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch progress data
  useEffect(() => {
    async function fetchProgress() {
      if (!loading) {
        try {
          const fetchedProgress = await getProgressFromFirebase(courseName);
          setProgress(fetchedProgress);
          
          const activities = await getActivityHistory(courseName);
          setActivityHistory(activities);
        } catch (error) {
          console.error('Error fetching progress data:', error);
        }
      }
    }
    fetchProgress();
  }, [courseName, loading, isUserAuthenticated]);

  // Fetch chat and quiz history from Firestore or localStorage
  useEffect(() => {
    async function fetchChatAndQuizHistory() {
      if (!loading) {
        try {
          // Get both chat and quiz history
          const { chat, quiz } = await getAllChatHistory(courseName);
          
          // Update state with fetched history
          setChatHistory(chat || []);
          setQuizHistory(quiz || []);
        } catch (error) {
          console.error('Error fetching chat and quiz history:', error);
        }
      }
    }
    fetchChatAndQuizHistory();
  }, [courseName, loading, isUserAuthenticated]);
  
  // New function to fetch course assignments
  useEffect(() => {
    async function fetchCourseAssignments() {
      if (!loading && courseName && isUserAuthenticated) {
        try {
          if (!auth.currentUser) {
            console.warn("No user signed in");
            return;
          }
          
          // Get user's assignments from Firebase
          const userId = auth.currentUser.uid;
          const assignmentsRef = collection(db, "users", userId, "assignments");
          const assignmentsQuery = query(assignmentsRef);
          const querySnapshot = await getDocs(assignmentsQuery);
          
          // Convert to array of assignment objects
          const allAssignments = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            allAssignments.push({
              ...data,
              firestoreId: doc.id,
              // Convert Firestore timestamps if necessary
              createdDate: data.createdAt ? data.createdAt.toDate().toISOString() : data.createdDate
            });
          });
          
          // Filter assignments for this course
          const courseSpecificAssignments = allAssignments.filter(assignment => 
            assignment.subject === courseName ||
            (assignment.subject && courseName.includes(assignment.subject)) ||
            (assignment.subject && assignment.subject.includes(courseName))
          );
          
          setCourseAssignments(courseSpecificAssignments);
          
          // Set the current assignment (prioritize upcoming and in-progress ones)
          if (courseSpecificAssignments.length > 0) {
            // First try to find an in-progress assignment
            const inProgressAssignment = courseSpecificAssignments.find(a => a.status === 'in-progress');
            
            // Then try to find a pending assignment
            const pendingAssignment = courseSpecificAssignments.find(a => a.status === 'pending');
            
            // Set the current assignment (in-progress > pending > any)
            setCurrentAssignment(inProgressAssignment || pendingAssignment || courseSpecificAssignments[0]);
          }
        } catch (error) {
          console.error('Error fetching course assignments:', error);
        }
      }
    }
    
    fetchCourseAssignments();
  }, [courseName, loading, isUserAuthenticated]);

  // Update progress when completing activities
  const handleCompleteActivity = useCallback(async (incrementAmount = 5) => {
    try {
      // Trigger animation before updating the value
      setProgressAnimation(true);
      
      // Create activity object
      const activityObj = {
        type: mode,
        name: `${mode === 'chat' ? 'Tutor Session' : mode === 'quiz' ? 'Quiz Completion' : 'Resource Study'}`,
        score: mode === 'quiz' ? Math.floor(70 + Math.random() * 30) : null // Random score for quizzes
      };
      
      // Record activity in Firebase
      const newActivity = await recordActivity(courseName, activityObj);
      
      // Wait for animation to start before updating value
      setTimeout(() => {
        // Get the latest progress after recording activity
        getProgressFromFirebase(courseName).then(newProgress => {
          setProgress(newProgress);
          
          // Show success popup
          setShowProgressPopup(true);
          
          // Hide popup after 3 seconds
          setTimeout(() => {
            setShowProgressPopup(false);
            setProgressAnimation(false);
          }, 3000);
        });
      }, 300);
      
      // Update local activity history
      if (newActivity) {
        setActivityHistory(prev => [newActivity, ...prev]);
      }
      
    } catch (error) {
      console.error('Error updating progress:', error);
      setProgressAnimation(false);
    }
  }, [courseName, mode]);

  // Toggle activity history panel
  const toggleActivityPanel = () => {
    setShowActivityPanel(!showActivityPanel);
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Fetch course image using UserContext data
  useEffect(() => {
    if (!user.loadingUser && (user.courses || user.customCourses)) {
      let category = 'other'; // Default category

      // Find the courseId format (e.g., 'math-algebra' or custom name)
      const userCourseEntry = user.courses?.find(cId => {
        if (cId.includes('-')) {
          const [subjectId, courseCode] = cId.split('-');
          if (courseCode === 'other' && user.customCourses && user.customCourses[subjectId] === courseName) {
            return true; // Found custom course by name match
          }
          // Add logic here to map standard course IDs back to names if needed,
          // similar to processUserCourses in CoursesPage.jsx, to match courseName
          // This part might need refinement based on how courseName relates to cId
          // For now, we'll primarily rely on custom course name matching
        }
        return cId === courseName; // Direct match for non-standard IDs?
      });

      let courseIdentifier = courseName; // Use courseName as default identifier

      if (userCourseEntry) {
         courseIdentifier = userCourseEntry; // Use the ID from context if found
      } else {
         // Attempt to find based on custom course name match if not found directly
         const customMatch = Object.entries(user.customCourses || {}).find(([key, name]) => name === courseName);
         if (customMatch) {
            courseIdentifier = `${customMatch[0]}-other`; // Reconstruct identifier like 'subjectId-other'
         }
      }


      // Determine category based on the identifier
       if (courseIdentifier.includes('-')) {
         const [subjectId, courseCode] = courseIdentifier.split('-');
         const categoryMapping = {
            math: 'mathematics',
            science: 'science',
            history: 'history',
            language: 'language',
            foreign: 'language',
            computer: 'computer-science',
            engineering: 'engineering',
            economics: 'economics',
            psychology: 'psychology',
            art: 'arts',
            music: 'arts',
            physical: 'physical-education',
            other: 'other'
          };
          category = categoryMapping[subjectId] || 'other';

          // If it's a custom course, use the subjectId as category base
          if (courseCode === 'other' && user.customCourses && user.customCourses[subjectId] === courseName) {
             category = categoryMapping[subjectId] || 'other';
          }

       } else {
         // Fallback or handle cases where courseName doesn't have a standard ID format
         // This might need more robust logic depending on possible courseName values
         console.warn(`Could not determine category reliably for course: ${courseName}. Defaulting to 'other'.`);
       }


      const imageUrl = getSubjectImageUrl(courseName, category);
      setCourseImage(imageUrl);
      setLoading(false); // Consider moving loading state update if other async ops depend on user data
    } else if (!user.loadingUser) {
       // Handle case where user data is loaded but no courses found or context is empty
       console.warn("User data loaded, but couldn't determine course category for image.");
       setLoading(false); // Ensure loading stops
    }

    // Dependency on user loading state and potentially courses/customCourses
  }, [user.loadingUser, user.courses, user.customCourses, courseName]);

  // REMOVE or COMMENT OUT the old useEffect that uses localStorage for image loading
  /*
  useEffect(() => {
    // Load user data and course details
    const onboardingData = localStorage.getItem('onboardingData');
    if (onboardingData) {
      const userData = JSON.parse(onboardingData);
      if (userData.nickname) setNickname(userData.nickname);
      
      // Get course details
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
        'Finance': 'economics',
        'General Psychology': 'psychology',
        'Developmental Psychology': 'psychology',
        'Cognitive Psychology': 'psychology',
        'Abnormal Psychology': 'psychology',
        'Social Psychology': 'psychology'
      };
      
      // Get the category for the course name
      const category = categoryMapping[courseName] || 'other';
      
      // Get course image
      const imageUrl = getSubjectImageUrl(courseName, category);
      setCourseImage(imageUrl);

      // Load chat history from localStorage
      const storedChatHistory = localStorage.getItem(`chatHistory_${courseName}`);
      if (storedChatHistory) {
        setChatHistory(JSON.parse(storedChatHistory));
      }
      
      // Finished loading
      setLoading(false);
    } else {
      // No user data found
      setLoading(false);
    }
  }, [courseName]);
  */

  // Function to handle starting a chat
  const handleStartChat = () => {
    setMode('chat');
    
    // Always create a new unique session ID for a new conversation
    const newSessionId = forceNewSession(courseName, 'chat');
    setCurrentSessionId(newSessionId);
    
    // Add initial tutor message
    const initialMessage = {
      sender: 'bot',
      content: `Hi, I'm your ${courseName} tutor. What do you need assistance with today?`,
      timestamp: new Date().toISOString()
    };
    
    setChatMessages([initialMessage]);
    
    // Add assignment context if there is a current assignment
    if (currentAssignment) {
      setTimeout(() => {
        // Add a message about the current assignment
        const assignmentMessage = {
          sender: 'bot',
          content: `I see you have an assignment on "${currentAssignment.title}" due ${formatAssignmentDate(currentAssignment.dueDate)}. Would you like help with this assignment?`,
          timestamp: new Date().toISOString()
        };
        
        setChatMessages(prevMessages => [...prevMessages, assignmentMessage]);
      }, 1000);
    }
  };

  // Function to handle starting a quiz
  const handleStartQuiz = async () => {
    setMode('quiz');
    setIsThinking(true);
    
    // Always create a new unique session ID for a new quiz
    const newSessionId = forceNewSession(courseName, 'quiz');
    setCurrentSessionId(newSessionId);
    
    try {
      // Add initial welcome message
      const welcomeMessage = {
        sender: 'bot',
        content: `Welcome to the ${courseName} quiz! I'll ask you a series of questions to test your knowledge.`,
        timestamp: new Date().toISOString()
      };
      
      const initialMessages = [welcomeMessage];
      
      // Add context about current assignment if available
      if (currentAssignment) {
        const assignmentMessage = {
          sender: 'bot',
          content: `This quiz will focus on topics related to your current assignment: "${currentAssignment.title}".`,
          timestamp: new Date().toISOString()
        };
        
        initialMessages.push(assignmentMessage);
      }
      
      setChatMessages(initialMessages);

      // Add a temporary thinking message for the question generation
      const tempBotMessageId = Date.now().toString();
      const thinkingMessage = {
        id: tempBotMessageId,
        sender: 'bot',
        content: '',
        timestamp: new Date().toISOString(),
        isThinking: true
      };
      
      setChatMessages(prevMessages => [...prevMessages, thinkingMessage]);
      
      // Generate first quiz question using Gemini, related to assignment if possible
      const topic = currentAssignment ? currentAssignment.title.split(':').pop() : '';
      const question = await generateQuizQuestion(courseName, topic);
      
      // Replace thinking message with the actual question
      setChatMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === tempBotMessageId 
            ? { ...msg, content: question, isThinking: false } 
            : msg
        )
      );
      
      // This is the first entry we save to history for this session
      await saveChatHistory(
        courseName,
        'quiz',
        'quiz_question',
        question,
        newSessionId
      );
    } catch (error) {
      console.error("Error starting quiz:", error);
      // Add fallback message if there's an error
      const fallbackMessage = {
        sender: 'bot',
        content: `What are the key principles of ${courseName} that you've learned so far?`,
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prevMessages => 
        prevMessages.filter(msg => !msg.isThinking).concat([fallbackMessage])
      );
      
      // Save fallback question to quiz history
      await saveChatHistory(
        courseName,
        'quiz',
        'quiz_question',
        fallbackMessage.content,
        newSessionId
      );
    } finally {
      setIsThinking(false);
    }
  };

  // Function to handle starting the learning resources
  const handleStartResources = async () => {
    setMode('resources');
    
    // Always create a new unique session ID for resources view
    const newSessionId = forceNewSession(courseName, 'resources');
    setCurrentSessionId(newSessionId);
    
    const initialMessages = [{
      sender: 'bot',
      content: `Here are some learning resources for ${courseName}. These will help you master the subject.`,
      timestamp: new Date().toISOString()
    }];
    
    // Add message about current assignment if available
    if (currentAssignment) {
      initialMessages.push({
        sender: 'bot',
        content: `I've included materials that will help you with your assignment: "${currentAssignment.title}".`,
        timestamp: new Date().toISOString()
      });
    }
    
    const resourcesMessage = {
      sender: 'bot',
      content: generateResourcesList(courseName, currentAssignment),
      timestamp: new Date().toISOString(),
      isResource: true
    };
    
    initialMessages.push(resourcesMessage);
    setChatMessages(initialMessages);
    
    // Record activity for accessing resources
    await recordActivity(courseName, {
      type: 'resources',
      name: 'Resource Access',
      score: null
    });
  };

  // Generate dynamic system prompt based on course
  const generateSystemPrompt = (course) => {
    // Base system prompt identifying the AI as AdaptIQ
    const basePrompt = "You are AdaptIQ, an intelligent AI tutor specializing in personalized education. You adapt to individual learning styles and preferences to provide the best educational experience. ";
    
    // Course-specific prompts
    const coursePrompts = {
      'Algebra': basePrompt + "As a mathematics tutor specializing in Algebra, use clear explanations with step-by-step reasoning. Break down algebraic concepts like equations, variables, functions, and expressions. Provide visual representations when possible and use examples that students can relate to.",
      
      'Geometry': basePrompt + "As a Geometry tutor, include descriptions of diagrams in your explanations when discussing shapes, and provide proofs when necessary. Cover topics like angles, triangles, polygons, circles, and coordinate geometry. Be precise with your mathematical language.",
      
      'Calculus': basePrompt + "As a Calculus tutor, explain concepts with both mathematical formulas and intuitive explanations. Make connections between derivatives, integrals, and their real-world applications. Always clarify notation and include step-by-step solutions.",
      
      'Physics': basePrompt + "As a Physics tutor, explain concepts with both mathematical formulas and intuitive real-world examples. Relate physics principles to everyday experiences. Remember to clarify the units and dimensions in your answers and explain the underlying laws of nature.",
      
      'Chemistry': basePrompt + "As a Chemistry tutor, explain molecular structures, reaction mechanisms, and chemical processes clearly. Connect chemistry concepts to real-world applications and use examples from everyday life whenever possible.",
      
      'Biology': basePrompt + "As a Biology tutor, explain biological processes and systems with clear connections to their functions. Use analogies to help students understand complex processes and relate concepts to real-world examples in health, environment, and everyday life.",
      
      'Programming': basePrompt + "As a Programming tutor, provide code examples in your explanations and ensure your code is correct and follows best practices. Explain the logic behind programming concepts clearly and relate them to practical applications.",
      
      'Web Development': basePrompt + "As a Web Development tutor, provide code examples using HTML, CSS, and JavaScript where appropriate. Explain both frontend and backend concepts clearly and offer practical tips for designing and implementing web applications.",
      
      'General Psychology': basePrompt + "As a Psychology tutor specializing in general concepts, explain psychological theories, research methods, and key studies. Use clear examples from real-world scenarios and avoid clinical diagnoses or therapeutic advice."
    };
    
    // Get the base prompt either from the course-specific prompts or a default
    const promptBase = coursePrompts[course] || `${basePrompt}As a knowledgeable tutor in ${course}, provide clear, accurate, and helpful responses to student questions. Use examples where appropriate and break down complex concepts into understandable parts.`;
    
    // Add assignment details if available
    let fullPrompt = promptBase;
    
    if (currentAssignment) {
      // Create a comprehensive assignment context section
      const assignmentContext = `
\nASSIGNMENT CONTEXT:
The student is currently working on an assignment with the following details:

Title: "${currentAssignment.title}"
Due Date: ${formatAssignmentDate(currentAssignment.dueDate)}
Status: ${currentAssignment.status}
Description: ${currentAssignment.description || "No detailed description available."}
${currentAssignment.estimatedMinutes ? `Estimated Time: ${currentAssignment.estimatedMinutes} minutes` : ""}
${currentAssignment.category ? `Subject Area: ${currentAssignment.category}` : ""}

${currentAssignment.resources && currentAssignment.resources.length > 0 ? 
  `Recommended Resources: 
   ${currentAssignment.resources.map(res => `- ${res.title || 'Resource'} (${res.type})`).join('\n   ')}` 
  : ""}

When the student asks questions related to this assignment, provide targeted help that will enable them to 
complete the assignment successfully. Focus on guiding their learning rather than providing direct answers.
`;
      
      // Add the assignment context to the prompt
      fullPrompt += assignmentContext;
    }
    
    return fullPrompt;
  };

  // Update the quiz question generator to include assignment topic
  const generateQuizQuestion = async (course, topic = '') => {
    try {
      // Create a prompt for Gemini to generate a question
      const prompt = topic 
        ? `Generate a challenging but fair quiz question about ${course} focused on the topic of "${topic}". The question should test understanding rather than just factual recall.`
        : `Generate a challenging but fair quiz question about ${course}. The question should test understanding rather than just factual recall.`;
      
      if (!API_KEY) {
        console.warn("API key not found, using fallback quiz questions");
        // Fallback quiz questions if no API key
        const fallbackQuestions = {
          'Algebra': 'If 3x + 5 = 20, what is the value of x?',
          'Geometry': 'What is the area of a circle with radius 5 units?',
          'Calculus': 'What is the derivative of f(x) = x²?',
          'Physics': 'What is Newton\'s Second Law of Motion?',
          'Chemistry': 'What is the chemical formula for water?',
          'Biology': 'What are the main components of a cell?',
          'World History': 'When did World War II end?',
          'Programming': 'What does HTML stand for?',
          'Web Development': 'What is the purpose of CSS in web development?',
          'General Psychology': 'What is the difference between classical and operant conditioning?',
        };
        
        return topic
          ? `Regarding the topic "${topic}": What's one key concept you've learned about this in ${course}?`
          : (fallbackQuestions[course] || `What is one key concept you've learned in ${course}?`);
      }
      
      const content = await model.generateContent(prompt);
      const response = content.response.text();
      
      return response || `What is one key concept you've learned in ${course}?`;
    } catch (error) {
      console.error("Error generating quiz question:", error);
      return `What is one key concept you've learned in ${course}?`;
    }
  };

  // Update resource generator to include assignment-related resources
  const generateResourcesList = (course, assignment = null) => {
    const resourceTypes = [
      { title: "Recommended Textbooks", icon: "📚" },
      { title: "Video Lectures", icon: "🎥" },
      { title: "Interactive Exercises", icon: "⚙️" },
      { title: "Academic Papers", icon: "📝" },
      { title: "Online Courses", icon: "💻" }
    ];
    
    return (
      <div className="resources-list">
        {assignment && (
          <div className="resource-item assignment-resource">
            <div className="resource-icon">📋</div>
            <div className="resource-content">
              <h3>Current Assignment</h3>
              <p>{assignment.title}</p>
              <div className="assignment-details">
                <span className="assignment-due">
                  <IconClock size={16} />
                  Due: {formatAssignmentDate(assignment.dueDate)}
                </span>
                <span className={`assignment-status status-${assignment.status}`}>
                  {assignment.status === 'pending' ? 'Not Started' : 
                  assignment.status === 'in-progress' ? 'In Progress' : 
                  assignment.status === 'completed' ? 'Completed' : 'Overdue'}
                </span>
              </div>
              <button 
                className="resource-explore-btn assignment-btn"
                onClick={() => window.location.href = "/dashboard/assignments"}
              >
                View Details
              </button>
            </div>
          </div>
        )}
        
        {resourceTypes.map((resource, index) => (
          <div key={index} className="resource-item">
            <div className="resource-icon">{resource.icon}</div>
            <div className="resource-content">
              <h3>{resource.title}</h3>
              <p>Top {course} materials {assignment ? 'related to ' + assignment.title.split(':')[0] : ''} selected for your learning style.</p>
              <button className="resource-explore-btn">Explore</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Generate a chat response using Gemini (streaming version)
  const generateChatResponse = async (userMessage, course, handleStreamingUpdate, context = '') => {
    try {
      if (!API_KEY) {
        console.warn("API key not found, using fallback chat responses");
        // Fallback responses if no API key
        const simpleResponses = {
          'Algebra': "In algebra, we work with variables and equations. For your question, I'd approach it by isolating the variable first, then solving step by step. Would you like me to show a detailed solution?",
          'Geometry': "Geometry is all about shapes and their properties. For your question, we can use theorems related to angles, distances, or areas. Let me sketch out a solution approach.",
          'Calculus': "This is a great calculus question! We would typically approach this using derivatives or integrals, depending on whether we're looking at rates of change or accumulated values.",
          'Physics': "This physics problem involves fundamental principles. Let's identify the forces involved, apply the relevant laws, and solve for the unknowns step by step.",
          'Chemistry': "In chemistry, this would involve understanding molecular structures and reactions. Let's break down the chemical processes involved.",
          'Programming': "For this programming question, I'd recommend an approach using data structures and algorithms. Let me outline a solution with pseudocode first, then we can implement it together."
        };
        
        if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
          return `Hello! I'm happy to help with any ${course} questions you have today. What would you like to learn about?`;
        }
        
        if (userMessage.toLowerCase().includes('thank')) {
          return "You're welcome! Is there anything else you'd like to know about this topic?";
        }
        
        if (userMessage.toLowerCase().includes('assignment') && currentAssignment) {
          return `Your current assignment "${currentAssignment.title}" is due ${formatAssignmentDate(currentAssignment.dueDate)}. Let me help you understand the key concepts needed to complete it.`;
        }
        
        return simpleResponses[course] || `That's an interesting question about ${course}. Let me explain this concept clearly. The main principles involve key concepts which apply in situations like typical examples. Does that help clarify things?`;
      }
      
      // Create the system prompt for the specific course
      let systemPrompt = generateSystemPrompt(course);
      
      // Add context about current assignment if available
      if (currentAssignment) {
        systemPrompt += `\n\nContext: The student is currently working on an assignment titled "${currentAssignment.title}" which is due on ${formatAssignmentDate(currentAssignment.dueDate)}. The assignment status is ${currentAssignment.status}.`;
      }
      
      // Generate content with the system prompt
      const prompt = `${systemPrompt}\n\n${context}\n\nStudent question: ${userMessage}\n\nYour helpful response:`;
      
      // Use streaming API
      const streamingResult = await model.generateContentStream(prompt);
      
      // Initialize empty response string for accumulating chunks
      let responseText = "";
      
      // Process the streaming response
      for await (const chunk of streamingResult.stream) {
        const chunkText = chunk.text();
        responseText += chunkText;
        
        // Call the callback function with the accumulated text so far
        if (handleStreamingUpdate) {
          handleStreamingUpdate(responseText);
        }
      }
      
      return responseText;
    } catch (error) {
      console.error("Error generating chat response:", error);
      return `I'm sorry, I'm having trouble connecting to my knowledge system about ${course} right now. Could you try again in a moment?`;
    }
  };

  // Evaluate a quiz answer using Gemini (streaming version)
  const evaluateQuizAnswer = async (answer, question, course, handleStreamingUpdate) => {
    try {
      if (!API_KEY) {
        console.warn("API key not found, using fallback quiz evaluation");
        // Fallback response if no API key
        return `Thanks for your answer! Here's some feedback: [detailed explanation of the correct approach]. Would you like to try another question?`;
      }
      
      // Create the system prompt for evaluation
      const systemPrompt = `You are AdaptIQ, an intelligent AI tutor specializing in ${course} education. You're evaluating a student's answer to a quiz question. Provide constructive feedback that acknowledges what's correct and gently corrects misconceptions. Be encouraging and educational.`;
      
      // Generate evaluation
      const prompt = `${systemPrompt}\n\nQuestion: ${question}\n\nStudent's answer: ${answer}\n\nYour educational feedback:`;
      
      // Use streaming API
      const streamingResult = await model.generateContentStream(prompt);
      
      // Initialize empty response string for accumulating chunks
      let responseText = "";
      
      // Process the streaming response
      for await (const chunk of streamingResult.stream) {
        const chunkText = chunk.text();
        responseText += chunkText;
        
        // Call the callback function with the accumulated text so far
        if (handleStreamingUpdate) {
          handleStreamingUpdate(responseText);
        }
      }
      
      return responseText;
    } catch (error) {
      console.error("Error evaluating quiz answer:", error);
      return `Thank you for your answer. I'm having trouble evaluating it at the moment, but I appreciate your engagement with the material. Would you like to try another question?`;
    }
  };
  
  // Handle sending a message in chat mode - using server API for PDF handling
  const handleSendMessage = async () => {
    if (!currentMessage.trim() && !selectedFile) return;
    
    // Create user message object - include file if available
    const newUserMessage = {
      id: Date.now().toString() + '-user', // Add unique ID
      sender: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString(),
      // Include file data if a file is selected
      ...(selectedFile && {
        file: {
          type: fileType,
          name: fileName,
          ext: fileExt,
          preview: previewUrl
        }
      })
    };
    
    setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
    setCurrentMessage('');
    
    // Reset file preview if there was a file
    if (showFilePreview) {
      setShowFilePreview(false);
      setSelectedFile(null);
      setPreviewUrl('');
      setFileType('');
      setFileName('');
      setFileExt('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    
    // Add a temporary placeholder for the bot's response with thinking indicator
    const tempBotMessageId = Date.now().toString() + '-bot'; // Use unique ID
    const tempBotMessage = {
      id: tempBotMessageId, // Assign unique ID
      sender: 'bot',
      content: '',
      timestamp: new Date().toISOString(),
      isThinking: true // Added isThinking flag instead of isStreaming
    };
    
    setChatMessages(prevMessages => [...prevMessages, tempBotMessage]);
    
    try {
      // Get the last bot message if in quiz mode to use as the question
      let question = '';
      if (mode === 'quiz') {
        const lastBotMessage = [...chatMessages].reverse().find(msg => msg.sender === 'bot');
        if (lastBotMessage) {
          question = lastBotMessage.content;
        }
      }
      
      // Create a function to handle streaming updates
      const handleStreamingUpdate = (text) => {
        setChatMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === tempBotMessageId 
              ? { ...msg, content: text, isThinking: false } // Set isThinking to false when content starts streaming
              : msg
          )
        );
      };
      
      // Generate response based on the current mode
      let responseContent = '';
      
      if (mode === 'chat') {
        if (newUserMessage.file) {
          // Handle file analysis if a file was attached
          try {
            // User prompt
            const prompt = currentMessage.trim() || 
              `Analyze this ${newUserMessage.file.type === 'image' ? 'image' : 'PDF document'} in detail and explain what you see.`;
            
            if (newUserMessage.file.type === 'image') {
              // EXACT implementation from gemini-vision.js for images
              const base64Data = newUserMessage.file.preview.split(',')[1];
              
              // Use the GoogleGenerativeAI model as in gemini-vision.js
              const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
              
              // Same format as fileToGenerativePart in gemini-vision.js
              const imagePart = {
                inlineData: {
                  data: base64Data,
                  mimeType: `image/${newUserMessage.file.ext}`
                }
              };
              
              // Same pattern as in gemini-vision.js: [prompt, ...imageParts]
              const generatedContent = await model.generateContent([prompt, imagePart]);
              responseContent = generatedContent.response.text();
              handleStreamingUpdate(responseContent);
            } 
            else if (newUserMessage.file.type === 'pdf') {
              // Using our Node.js server for PDFs without showing processing message
              try {
                // Create a FormData object to send the file to the server
                const formData = new FormData();
                
                // Convert data URL back to a file object
                const base64Response = await fetch(newUserMessage.file.preview);
                const blob = await base64Response.blob();
                const file = new File([blob], newUserMessage.file.name, { type: 'application/pdf' });
                
                // Append the file and prompt to the FormData
                formData.append('pdfFile', file);
                formData.append('prompt', prompt);
                
                // Send the request to our local PDF processing server
                const serverUrl = 'http://localhost:3001/api/process-pdf';
                const response = await fetch(serverUrl, {
                  method: 'POST',
                  body: formData,
                });
                
                // Parse the JSON response
                const responseData = await response.json();
                
                if (responseData.success) {
                  responseContent = responseData.text;
                } else {
                  throw new Error(responseData.message || 'Error processing PDF');
                }
                
                // Update the streaming response with the final content
                handleStreamingUpdate(responseContent);
              } catch (fileError) {
                console.error("Error analyzing file:", fileError);
                responseContent = `I encountered an error while trying to analyze your PDF file. Could you try again or describe what's in the file?`;
                handleStreamingUpdate(responseContent);
              }
            }
          } catch (fileError) {
            console.error("Error analyzing file:", fileError);
            responseContent = `I encountered an error while trying to analyze your ${newUserMessage.file.type} file "${newUserMessage.file.name}". ` +
              `This could be due to file format issues or processing limitations. Error: ${fileError.message}. ` +
              `Could you try again with a different file or describe what's in the file?`;
            handleStreamingUpdate(responseContent);
          }
        } else {
          // No file attached, proceed with normal chat response
          responseContent = await generateChatResponse(
            currentMessage, 
            courseName, 
            handleStreamingUpdate,
            chatMessages.slice(-6).map(msg => `${msg.sender === 'user' ? 'Student' : 'AI Tutor'}: ${msg.content}`).join('\n\n')
          );
        }
      } else if (mode === 'quiz') {
        responseContent = await evaluateQuizAnswer(currentMessage, question, courseName, handleStreamingUpdate);
      }
      
      // If streaming didn't work for some reason, update the message at the end
      setChatMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === tempBotMessageId 
            ? { ...msg, content: responseContent, isThinking: false } 
            : msg
        )
      );
      
      // Save to appropriate history collection in Firestore based on mode
      await saveChatHistory(
        courseName,
        mode,
        newUserMessage.file 
          ? `[File uploaded: ${newUserMessage.file.type}] ${currentMessage}` 
          : currentMessage,
        responseContent,
        currentSessionId
      );
      
      // Refresh the history from the server to show updated sessions
      if (mode === 'chat') {
        const updatedChatHistory = await getChatHistory(courseName, 'chat');
        setChatHistory(updatedChatHistory);
      } else if (mode === 'quiz') {
        const updatedQuizHistory = await getChatHistory(courseName, 'quiz');
        setQuizHistory(updatedQuizHistory);
      }
      
      // Generate a follow-up question if in quiz mode
      if (mode === 'quiz') {
        setTimeout(async () => {
          const nextQuestion = await generateQuizQuestion(courseName);
          const nextQuestionMessage = {
            id: Date.now().toString(),
            sender: 'bot',
            content: nextQuestion,
            timestamp: new Date().toISOString()
          };
          setChatMessages(prevMessages => [...prevMessages, nextQuestionMessage]);
          
          // Save the follow-up question to quiz history with the same session ID
          await saveChatHistory(
            courseName,
            'quiz',
            'follow_up_question',
            nextQuestion,
            currentSessionId
          );
        }, 2000);
      }
      
    } catch (error) {
      console.error("Error generating response:", error);
      // Add fallback error message - update the thinking bubble instead of adding a new one
      setChatMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === tempBotMessageId 
            ? { 
                ...msg, 
                content: `I'm sorry, I encountered an issue while processing your request. Please try again later.`, 
                isThinking: false 
              } 
            : msg
        )
      );
    }
  };

  // Handle key press in chat input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Toggle chat history visibility
  const toggleChatHistory = () => {
    setShowChatHistory(!showChatHistory);
    
    // If we're showing history, refresh it from Firestore
    if (!showChatHistory) {
      getChatHistory(courseName, mode).then(history => {
        if (mode === 'chat') {
          setChatHistory(history);
        } else if (mode === 'quiz') {
          setQuizHistory(history);
        }
      });
    }
  };

  // Load a conversation from history
  const loadConversationFromHistory = async (historyItem) => {
    // If we're in the select mode, switch to chat mode first
    if (mode === 'select') {
      setMode(historyItem.mode || 'chat');
    }
    
    // Set the current session ID to the one from the history item
    setCurrentSessionId(historyItem.sessionId);
    
    // Load the full conversation session
    const session = await getConversationSession(courseName, historyItem.mode || mode, historyItem.sessionId);
    
    if (session && session.messages && session.messages.length > 0) {
      // Convert the messages to the format expected by the chat UI
      const formattedMessages = session.messages.map(msg => ({
        sender: msg.role === 'user' ? 'user' : 'bot',
        content: msg.content,
        timestamp: msg.timestamp,
        id: msg.timestamp // Use timestamp as ID for simplicity
      }));
      
      // Set the messages
      setChatMessages(formattedMessages);
    } else {
      // Fallback to just showing the first exchange if full session not available
      const starterMessages = [
        {
          sender: 'user',
          content: historyItem.userMessage,
          timestamp: historyItem.timestamp
        },
        {
          sender: 'bot',
          content: historyItem.botResponse,
          timestamp: new Date(new Date(historyItem.timestamp).getTime() + 1000).toISOString()
        }
      ];
      
      // Set the messages
      setChatMessages(starterMessages);
    }
    
    // Hide the history panel
    setShowChatHistory(false);
    
    // Record this activity
    recordActivity(courseName, {
      type: historyItem.mode || mode,
      name: `Resumed ${historyItem.mode || mode} Session`
    });
  };

  // File upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [fileType, setFileType] = useState(''); // 'image' or 'pdf'
  const [fileName, setFileName] = useState('');
  const [fileExt, setFileExt] = useState('');

  // Handle file selection - using the approach from example files
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Clear any existing file first
      cancelFileUpload();
      
      setSelectedFile(file);
      setFileName(file.name);
      
      // Determine file type and extension
      const fileExtension = file.name.split('.').pop().toLowerCase();
      setFileExt(fileExtension);
      
      // Handle image files exactly as in gemini-vision.js
      if (file.type.startsWith('image/')) {
        setFileType('image');
        const fileReader = new FileReader();
        fileReader.onload = (event) => {
          // Store the base64 data for later processing
          const base64Data = event.target.result.split(',')[1]; // Remove data URL prefix
          setPreviewUrl(event.target.result); // For preview, keep the full data URL
          setShowFilePreview(true);
        };
        fileReader.onerror = (error) => {
          console.error("Error reading image file:", error);
          cancelFileUpload();
        };
        fileReader.readAsDataURL(file);
      } 
      // Handle PDF files exactly as in gemini-doc.js, but adapted for browser
      else if (fileExtension === 'pdf') {
        setFileType('pdf');
        const fileReader = new FileReader();
        fileReader.onload = (event) => {
          // Store the base64 data for later processing
          setPreviewUrl(event.target.result); // Keep full data URL for now
          setShowFilePreview(true);
        };
        fileReader.onerror = (error) => {
          console.error("Error reading PDF file:", error);
          cancelFileUpload();
        };
        fileReader.readAsDataURL(file);
      } else {
        // If not a supported file type
        alert("Please select either an image file (JPEG, PNG) or a PDF document");
        cancelFileUpload();
      }
    }
  };

  // Cancel file upload
  const cancelFileUpload = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setShowFilePreview(false);
    setFileType('');
    setFileName('');
    setFileExt('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit file with question
  const submitWithFile = () => {
    if (!currentMessage.trim() && !selectedFile) return;
    
    // Create message content with file
    const newUserMessage = {
      sender: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString(),
      file: {
        type: fileType,
        name: fileName,
        ext: fileExt,
        preview: previewUrl
      }
    };
    
    setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
    setCurrentMessage('');
    setShowFilePreview(false);
    setSelectedFile(null);
    setPreviewUrl('');
    setFileType('');
    setFileName('');
    setFileExt('');
    setIsThinking(true);
    
    // Simulate response from AI tutor
    setTimeout(() => {
      const responseContent = `I've analyzed the file you've shared. ${generateChatResponse('file analysis ' + currentMessage, courseName)}`;
      
      const botResponse = {
        sender: 'bot',
        content: responseContent,
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prevMessages => [...prevMessages, botResponse]);
      setIsThinking(false);
      
      // Save to chat history using the current session ID
      saveChatHistory(
        courseName,
        mode,
        `[File uploaded] ${currentMessage}`,
        responseContent,
        currentSessionId
      );
      
      // Refresh the history from the server
      getChatHistory(courseName, mode).then(history => {
        if (mode === 'chat') {
          setChatHistory(history);
        } else if (mode === 'quiz') {
          setQuizHistory(history);
        }
      });
    }, 2000); // Slightly longer for file processing simulation
  };

  // Reset conversation history for the current mode
  const clearConversationHistory = async () => {
    try {
      await clearChatHistory(courseName, mode);
      
      if (mode === 'chat') {
        setChatHistory([]);
      } else if (mode === 'quiz') {
        setQuizHistory([]);
      }
      
      setShowChatHistory(false);
      
      // End the current session since we've cleared history
      endCurrentSession(courseName, mode);
      setCurrentSessionId(null);
    } catch (error) {
      console.error("Error clearing conversation history:", error);
    }
  };

  // Scroll to bottom effect
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]); // Add this useEffect

  return (
    <motion.div
      // Apply the theme class here
      className={`dashboard-page ${isDarkMode ? 'dark-theme' : ''}`} 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <img src={Logo} alt="AdaptIQ Logo" className="dashboard-logo" />
        </div>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item">
            <IconLayoutDashboard size={24} /> {/* Changed Icon */}
            <span>Overview</span>
          </Link>
          {/* Added Chat Link */}
          <Link to="/dashboard/chat" className="nav-item">
            <IconMessageCircle size={24} />
            <span>Chat</span>
          </Link>
          <Link to="/dashboard/courses" className="nav-item">
            <IconBook size={24} />
            <span>Courses</span>
          </Link>
          <Link to="/dashboard/assignments" className="nav-item">
            <IconClipboard size={24} />
            <span>Assignments</span>
          </Link>
          <Link to="/dashboard/schedule" className="nav-item">
            <IconCalendar size={24} />
            <span>Schedule</span>
          </Link>
          <Link to="/dashboard/inspiration" className="nav-item">
            <IconSparkles size={24} />
            <span>Inspiration</span>
          </Link>
          <Link to="/dashboard/profile" className="nav-item">
            <IconUser size={24} />
            <span>Profile</span>
          </Link>
          <Link to="/dashboard/settings" className="nav-item">
            <IconSettings size={24} />
            <span>Settings</span>
          </Link>
        </nav>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-header course-learning-header">
          <div className="course-header-left">
            <Link to="/dashboard/courses" className="back-button">
              <IconArrowLeft size={24} />
              <span>Back to Courses</span>
            </Link>
            <h1>{courseName}</h1>
          </div>
          <div className="header-actions">
            <button 
              className={`activity-history-button ${showActivityPanel ? 'active' : ''}`}
              onClick={toggleActivityPanel}
            >
              <IconActivity size={20} />
              <span>Activity</span>
            </button>
            <div className="user-profile">
              <span className="user-name">{nickname || 'Guest'}</span>
              <div className="user-avatar">{nickname ? nickname.substring(0, 2).toUpperCase() : 'G'}</div>
            </div>
          </div>
        </div>
        
        {/* Progress Bar - Only visible on mode selection page */}
        {mode === 'select' && (
          <motion.div 
            className="progress-bar-container"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="progress-header">
              <h3>Course Progress</h3>
              <span className="progress-percentage">{progress}%</span>
            </div>
            <div className="progress-bar">
              <motion.div 
                className={`progress-fill ${progressAnimation ? 'animating' : ''}`}
                initial={{ width: `${Math.max(0, progress - 5)}%` }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              ></motion.div>
            </div>
          </motion.div>
        )}
        
        {/* Activity History Panel */}
        <AnimatePresence>
          {showActivityPanel && (
            <motion.div 
              className="activity-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="activity-panel-header">
                <h3>Learning Activity History</h3>
                <button className="refresh-activity-button" onClick={() => getActivityHistory(courseName)}>
                  <IconRefresh size={16} />
                </button>
              </div>
              
              {activityHistory.length > 0 ? (
                <div className="activity-list">
                  {activityHistory.map((activity) => (
                    <div key={activity.id} className={`activity-item activity-${activity.type}`}>
                      <div className="activity-icon">
                        {activity.type === 'quiz' ? <IconQuestionMark size={18} /> : 
                         activity.type === 'chat' ? <IconMessageCircle size={18} /> : 
                         <IconNotebook size={18} />}
                      </div>
                      <div className="activity-details">
                        <div className="activity-name">{activity.name}</div>
                        <div className="activity-date">{formatDate(activity.date)}</div>
                      </div>
                      {activity.score && (
                        <div className="activity-score">
                          <span className="score-value">{activity.score}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-activity">
                  <p>No learning activities recorded yet.</p>
                  <p>Start interacting with course materials to track your progress.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Progress Update Popup */}
        <AnimatePresence>
          {showProgressPopup && (
            <motion.div 
              className="progress-popup"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="progress-popup-icon">
                <IconChartLine size={24} />
              </div>
              <div className="progress-popup-content">
                <h4>Progress Updated!</h4>
                <p>Your {courseName} course progress is now at {progress}%</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Current Assignment Display */}
        {!loading && currentAssignment && mode === 'select' && (
          <motion.div 
            className="current-assignment-panel"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <div className="current-assignment-header">
              <h3>Current Assignment</h3>
              <Link to="/dashboard/assignments" className="view-all-assignments">
                View All
              </Link>
            </div>
<div className="current-assignment-content">
              <div className="assignment-icon">
                <IconClipboard size={24} />
              </div>
              <div className="assignment-details">
                <h4>{currentAssignment.title}</h4>
                <div className="assignment-meta">
                  <span className="assignment-due">
                    <IconClock size={16} />
                    Due: {formatAssignmentDate(currentAssignment.dueDate)}
                  </span>
                  <span className={`assignment-status status-${currentAssignment.status}`}>
                    {currentAssignment.status === 'pending' ? 'Not Started' : 
                    currentAssignment.status === 'in-progress' ? 'In Progress' : 
                    currentAssignment.status === 'completed' ? 'Completed' : 'Overdue'}
                  </span>
                </div>
              </div>
              {(currentAssignment.status === 'pending' || currentAssignment.status === 'in-progress') && (
                <motion.div 
                  className="assignment-warning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <IconAlertTriangle size={16} color="#ff9800" />
                  <span>
                    {new Date(currentAssignment.dueDate) < new Date() 
                      ? 'This assignment is overdue!' 
                      : `${Math.ceil((new Date(currentAssignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24))} days remaining`}
                  </span>
                </motion.div>
              )}
            </div>
<div className="current-assignment-content">
              <div className="assignment-icon">
                <IconClipboard size={24} />
              </div>
              <div className="assignment-details">
                <h4>{currentAssignment.title}</h4>
                <div className="assignment-meta">
                  <span className="assignment-due">
                    <IconClock size={16} />
                    Due: {formatAssignmentDate(currentAssignment.dueDate)}
                  </span>
                  <span className={`assignment-status status-${currentAssignment.status}`}>
                    {currentAssignment.status === 'pending' ? 'Not Started' : 
                    currentAssignment.status === 'in-progress' ? 'In Progress' : 
                    currentAssignment.status === 'completed' ? 'Completed' : 'Overdue'}
                  </span>
                </div>
              </div>
              {(currentAssignment.status === 'pending' || currentAssignment.status === 'in-progress') && (
                <motion.div 
                  className="assignment-warning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <IconAlertTriangle size={16} color="#ff9800" />
                  <span>
                    {new Date(currentAssignment.dueDate) < new Date() 
                      ? 'This assignment is overdue!' 
                      : `${Math.ceil((new Date(currentAssignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24))} days remaining`}
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        <div className="course-learning-content">
          {loading ? (
            <div className="course-loading">
              <div className="loading-animation">
                <IconBook size={64} className="loading-icon" />
                <div className="loading-spinner"></div>
              </div>
              <h2>Loading course content...</h2>
              <p>We're preparing your personalized learning experience</p>
            </div>
          ) : (
        <div className="course-learning-container">
              <AnimatePresence mode="wait">
          {mode === 'select' ? (
                  <motion.div 
                    key="mode-selector"
                    className="learning-mode-selector"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ 
                      duration: 0.3, 
                      type: "spring",
                      stiffness: 400,
                      damping: 30 
                    }}
                  >
                    <div className="course-banner">
                      <img src={courseImage} alt={courseName} className="course-banner-image" />
                      <div className="course-banner-overlay">
                        <h2>Welcome to {courseName}</h2>
                        <p>Select a learning mode to begin your personalized education journey</p>
                      </div>
        </div>

      <div className="learning-options">
                      <motion.div 
                        className="learning-option-card"
                        onClick={handleStartChat}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          duration: 0.25, 
                          type: "spring",
                          stiffness: 400,
                          damping: 25
                        }}
                        whileHover={{ y: -10, transition: { duration: 0.2 } }}
                      >
                        <div className="option-icon">
                          <IconMessageCircle size={48} />
                        </div>
                        <h3>Ask Questions</h3>
                        <p>Chat with your AI tutor to get answers to your questions</p>
                      </motion.div>
                      
                      <motion.div 
                        className="learning-option-card"
                        onClick={handleStartQuiz}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          duration: 0.25, 
                          type: "spring",
                          stiffness: 400,
                          damping: 25
                        }}
                        whileHover={{ y: -10, transition: { duration: 0.2 } }}
                      >
                        <div className="option-icon">
                          <IconQuestionMark size={48} />
                        </div>
                        <h3>Take a Quiz</h3>
                        <p>Test your knowledge with interactive quizzes</p>
                      </motion.div>
                      
                      <motion.div 
                        className="learning-option-card"
                        onClick={handleStartResources}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          duration: 0.25, 
                          type: "spring",
                          stiffness: 400,
                          damping: 25
                        }}
                        whileHover={{ y: -10, transition: { duration: 0.2 } }}
                      >
                        <div className="option-icon">
                          <IconNotebook size={48} />
                        </div>
                        <h3>Learning Resources</h3>
                        <p>Access curated study materials for this course</p>
                      </motion.div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="chat-interface"
                    className="chat-interface"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    <div className="chat-header">
                      <div className="chat-header-left">
                        <motion.button 
                          className="back-to-menu-button" 
                          onClick={() => {
                            // End the current session before returning to menu
                            endCurrentSession(courseName, mode);
                            setCurrentSessionId(null);
                            setMode('select');
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Back to menu"
                        >
                          <IconArrowLeft size={20} />
                        </motion.button>
                        <div className="chat-title">
                          <h2>
                            {mode === 'chat' ? 'Ask Questions' : 
                             mode === 'quiz' ? 'Knowledge Quiz' : 'Learning Resources'}
                          </h2>
                          <p>{courseName}</p>
                        </div>
                      </div>
                      <div className="chat-header-actions">
                        <button 
                          className="new-chat-button" 
                          onClick={() => {
                            // First complete the session (save existing functionality)
                            handleCompleteActivity(mode === 'quiz' ? 10 : 5);
                            
                            // Then start a new conversation
                            // Create a new session ID
                            const newSessionId = forceNewSession(courseName, mode);
                            setCurrentSessionId(newSessionId);
                            
                            // Add a transitional animation effect
                            const chatContainer = document.querySelector('.chat-messages');
                            if (chatContainer) {
                              chatContainer.style.opacity = '0';
                              chatContainer.style.transform = 'scale(0.98)';
                              
                              setTimeout(() => {
                                // Clear the current chat messages
                                setChatMessages([]);
                                
                                // Reset transitions for new messages
                                chatContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                                
                                setTimeout(() => {
                                  // Show the container again
                                  chatContainer.style.opacity = '1';
                                  chatContainer.style.transform = 'scale(1)';
                                  
                                  // Add initial tutor message for chat mode
                                  if (mode === 'chat') {
                                    const initialMessage = {
                                      sender: 'bot',
                                      content: `Hi, I'm your ${courseName} tutor. What do you need assistance with today?`,
                                      timestamp: new Date().toISOString()
                                    };
                                    
                                    setChatMessages([initialMessage]);
                                    
                                    // Add assignment context if there is a current assignment
                                    if (currentAssignment) {
                                      setTimeout(() => {
                                        // Add a message about the current assignment
                                        const assignmentMessage = {
                                          sender: 'bot',
                                          content: `I see you have an assignment on "${currentAssignment.title}" due ${formatAssignmentDate(currentAssignment.dueDate)}. Would you like help with this assignment?`,
                                          timestamp: new Date().toISOString()
                                        };
                                        
                                        setChatMessages(prevMessages => [...prevMessages, assignmentMessage]);
                                      }, 1000);
                                    }
                                  } 
                                  // Start a new quiz if in quiz mode
                                  else if (mode === 'quiz') {
                                    setIsThinking(true);
                                    
                                    // Add initial welcome message
                                    const welcomeMessage = {
                                      sender: 'bot',
                                      content: `Welcome to a new ${courseName} quiz! I'll ask you a series of questions to test your knowledge.`,
                                      timestamp: new Date().toISOString()
                                    };
                                    
                                    const initialMessages = [welcomeMessage];
                                    
                                    // Add context about current assignment if available
                                    if (currentAssignment) {
                                      const assignmentMessage = {
                                        sender: 'bot',
                                        content: `This quiz will focus on topics related to your current assignment: "${currentAssignment.title}".`,
                                        timestamp: new Date().toISOString()
                                      };
                                      
                                      initialMessages.push(assignmentMessage);
                                    }
                                    
                                    setChatMessages(initialMessages);

                                    // Add a temporary thinking message for the question generation
                                    const tempBotMessageId = Date.now().toString();
                                    const thinkingMessage = {
                                      id: tempBotMessageId,
                                      sender: 'bot',
                                      content: '',
                                      timestamp: new Date().toISOString(),
                                      isThinking: true
                                    };
                                    
                                    setChatMessages(prevMessages => [...prevMessages, thinkingMessage]);
                                    
                                    // Generate first quiz question
                                    generateQuizQuestion(courseName, currentAssignment ? currentAssignment.title.split(':').pop() : '')
                                      .then(question => {
                                        // Replace thinking message with the actual question
                                        setChatMessages(prevMessages => 
                                          prevMessages.map(msg => 
                                            msg.id === tempBotMessageId 
                                              ? { ...msg, content: question, isThinking: false } 
                                              : msg
                                          )
                                        );
                                        
                                        // Save to history
                                        saveChatHistory(
                                          courseName,
                                          'quiz',
                                          'quiz_question',
                                          question,
                                          newSessionId
                                        );
                                        
                                        setIsThinking(false);
                                      })
                                      .catch(error => {
                                        console.error("Error starting new quiz:", error);
                                        setIsThinking(false);
                                      });
                                  }
                                }, 50);
                              }, 200);
                            }
                          }}
                        >
                          {mode === 'chat' ? <IconMessageCircle size={18} /> : 
                           mode === 'quiz' ? <IconQuestionMark size={18} /> : 
                           <IconNotebook size={18} />}
                          <span>New {mode === 'chat' ? 'Chat' : mode === 'quiz' ? 'Quiz' : 'Resources'}</span>
                        </button>
                        {mode !== 'resources' && (
                          <>
                            <button 
                              className={`history-button ${showChatHistory ? 'active' : ''}`}
                              onClick={toggleChatHistory}
                            >
                              <IconHistory size={20} />
                              <span>History</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Chat History Panel - Only shown for chat and quiz modes */}
                    {mode !== 'resources' && (
                      <AnimatePresence>
                        {showChatHistory && (
                          <motion.div 
                            className="chat-history-panel"
                            initial={{ opacity: 0, x: 320 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 320 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="history-panel-header">
                              <h3>Recent {mode === 'chat' ? 'Conversations' : 'Quiz Sessions'}</h3>
                            </div>
                            
                            {/* Use the appropriate history based on mode */}
                            {(mode === 'chat' ? chatHistory : quizHistory).length > 0 ? (
                              <div className="history-list">
                                {(mode === 'chat' ? chatHistory : quizHistory).map((item, index) => (
                                  <div 
                                    key={index} 
                                    className="history-item"
                                    onClick={() => loadConversationFromHistory(item)}
                                  >
                                    <div className="history-metadata">
                                      <span className="history-date">
                                        {new Date(item.timestamp).toLocaleDateString()}
                                      </span>
                                      <span className="history-time">
                                        {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </span>
                                    </div>
                                    <div className="history-content">
                                      <p className="history-question">{item.userMessage}</p>
                                      <p className="history-answer">
                                        {typeof item.botResponse === 'string' 
                                          ? item.botResponse.substring(0, 60) + (item.botResponse.length > 60 ? '...' : '') 
                                          : 'Complex response...'}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="no-history">No {mode === 'chat' ? 'conversation' : 'quiz'} history yet</p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                    
                    {/* Chat Messages - Only for chat and quiz modes */}
                    {(mode === 'chat' || mode === 'quiz') && (
                      <motion.div 
                        className="chat-messages"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        {chatMessages.map((message, index) => (
                          <motion.div 
                            key={message.id || index} // Use unique ID if available
                            variants={itemVariants}
                            className={`chat-message ${message.sender === 'user' ? 'user-message' : 'bot-message'} ${mode === 'quiz' ? 'quiz-message' : ''}`}
                          >
                            <div className="message-avatar">
                              {message.sender === 'user' 
                                ? (nickname ? nickname.substring(0, 2).toUpperCase() : 'Y') 
                                : mode === 'quiz' ? 'Q' : courseName.substring(0, 2)
                              }
                            </div>
                            <div className={`message-content ${mode === 'quiz' && message.sender === 'bot' ? 'quiz-content' : ''}`}>
                              {message.isThinking ? (
                                <div className="thinking-indicator">
                                  <span></span>
                                  <span></span>
                                  <span></span>
                                </div>
                              ) : message.isResource ? (
                                message.content 
                              ) : message.file ? (
                                <>
                                  {message.file.type === 'image' && (
                                    <motion.div 
                                      className="message-image-container"
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ duration: 0.3 }}
                                    >
                                      <img src={message.file.preview} alt="Uploaded content" className="message-image" />
                                    </motion.div>
                                  )}
                                  {message.file.type === 'pdf' && (
                                    <motion.div 
                                      className="message-pdf-container"
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ duration: 0.3 }}
                                    >
                                      <div className="pdf-preview">
                                        <IconFileText size={48} />
                                        <span>{message.file.name}</span>
                                      </div>
                                    </motion.div>
                                  )}
                                  <p>{message.content}</p>
                                </>
                              ) : (
                                <div className="markdown-content">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {message.content}
                                  </ReactMarkdown>
                                </div>
                              )}
                              
                              {/* User message copy button */}
                              {message.sender === 'user' && !message.isThinking && (
                                <div className="message-actions user-message-actions">
                                  <button 
                                    className="message-action-btn"
                                    title="Copy to clipboard"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(message.content);
                                      
                                      // Visual feedback for copy button
                                      const button = e.currentTarget;
                                      const originalIcon = button.innerHTML;
                                      
                                      // Change button to checkmark
                                      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>';
                                      button.style.color = '#10b981'; // Success green color
                                      
                                      // Record feedback data for copied response (ML training data)
                                      if (currentSessionId) {
                                        updateMessageFeedback(
                                          courseName,
                                          mode,
                                          currentSessionId,
                                          message.timestamp,
                                          { copied_response: true }
                                        ).then(success => {
                                          console.log("Recorded copy feedback:", success);
                                        });
                                      }
                                      
                                      // Reset after 1.5 seconds
                                      setTimeout(() => {
                                        button.innerHTML = originalIcon;
                                        button.style.color = '';
                                      }, 1500);
                                    }}
                                  >
                                    <IconCopy size={14} />
                                  </button>
                                </div>
                              )}
                              
                              {/* Bot message actions */}
                              {message.sender === 'bot' && !message.isThinking && !message.isResource && (
                                <div className="message-actions">
                                  <button 
                                    className="message-action-btn"
                                    title="Copy to clipboard"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(message.content);
                                      
                                      // Visual feedback for copy button
                                      const button = e.currentTarget;
                                      const originalIcon = button.innerHTML;
                                      
                                      // Change button to checkmark
                                      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>';
                                      button.style.color = '#10b981'; // Success green color
                                      
                                      // Record feedback data for copied response (ML training data)
                                      if (currentSessionId) {
                                        updateMessageFeedback(
                                          courseName,
                                          mode,
                                          currentSessionId,
                                          message.timestamp,
                                          { copied_response: true }
                                        ).then(success => {
                                          console.log("Recorded copy feedback:", success);
                                        });
                                      }
                                      
                                      // Reset after 1.5 seconds
                                      setTimeout(() => {
                                        button.innerHTML = originalIcon;
                                        button.style.color = '';
                                      }, 1500);
                                    }}
                                  >
                                    <IconCopy size={14} />
                                  </button>
                                  <button 
                                    className={`message-action-btn ${likedMessages[message.id] ? 'liked' : ''}`}
                                    title="Like this response"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      
                                      // Update UI state
                                      setLikedMessages(prev => ({ ...prev, [message.id]: true }));
                                      setDislikedMessages(prev => ({ ...prev, [message.id]: false }));
                                      
                                      // Record feedback data for liked response (ML training data)
                                      if (currentSessionId) {
                                        updateMessageFeedback(
                                          courseName,
                                          mode,
                                          currentSessionId,
                                          message.timestamp,
                                          { 
                                            liked: true, 
                                            disliked: false,
                                            feedback_inferred: "positive"
                                          }
                                        ).then(success => {
                                          console.log("Recorded like feedback:", success);
                                        });
                                      }
                                      
                                      // Show thanks notification
                                      setShowLikeThanks(true);
                                      setTimeout(() => setShowLikeThanks(false), 2000);
                                    }}
                                  >
                                    <IconThumbUp size={14} />
                                  </button>
                                  <button 
                                    className={`message-action-btn ${dislikedMessages[message.id] ? 'disliked' : ''}`}
                                    title="Dislike this response"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      
                                      // Set the current message ID for feedback
                                      setFeedbackMessageId(message.id || Date.now().toString());
                                      
                                      // Mark as disliked immediately in UI
                                      setDislikedMessages(prev => ({ ...prev, [message.id]: true }));
                                      setLikedMessages(prev => ({ ...prev, [message.id]: false }));
                                      
                                      // Record initial feedback data (will be updated when text feedback is submitted)
                                      if (currentSessionId) {
                                        updateMessageFeedback(
                                          courseName,
                                          mode,
                                          currentSessionId,
                                          message.timestamp,
                                          { 
                                            disliked: true, 
                                            liked: false,
                                            feedback_inferred: "negative"
                                          }
                                        ).then(success => {
                                          console.log("Recorded dislike feedback:", success);
                                        });
                                      }
                                      
                                      // Show the feedback popup
                                      setShowFeedbackPopup(true);
                                    }}
                                  >
                                    <IconThumbDown size={14} />
                                  </button>
                                  <button 
                                    className="message-action-btn"
                                    title="Regenerate response"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      
                                      // Find the preceding user message
                                      const messageIndex = chatMessages.findIndex(msg => msg === message);
                                      let userMessageIndex = -1;
                                      
                                      // Look backwards from the current message to find the last user message
                                      for (let i = messageIndex - 1; i >= 0; i--) {
                                        if (chatMessages[i].sender === 'user') {
                                          userMessageIndex = i;
                                          break;
                                        }
                                      }
                                      
                                      // Record feedback data for regenerated response (ML training data)
                                      if (currentSessionId) {
                                        updateMessageFeedback(
                                          courseName,
                                          mode,
                                          currentSessionId,
                                          message.timestamp,
                                          { 
                                            regenerated: true,
                                            feedback_inferred: "weak_negative" 
                                          }
                                        ).then(success => {
                                          console.log("Recorded regenerate feedback:", success);
                                        });
                                      }
                                      
                                      if (userMessageIndex !== -1) {
                                        // Get the user's question that triggered this response
                                        const userMessage = chatMessages[userMessageIndex];
                                        
                                        // Create a copy of chat messages up to the user message
                                        const messagesToKeep = chatMessages.slice(0, messageIndex);
                                        
                                        // Add a temporary thinking message
                                        const regeneratingMessage = {
                                          id: Date.now().toString(),
                                          sender: 'bot',
                                          content: '',
                                          timestamp: new Date().toISOString(),
                                          isThinking: true
                                        };
                                        
                                        // Smooth animation: add thinking state first
                                        setChatMessages([...messagesToKeep, regeneratingMessage]);
                                        
                                        // Scroll to the bottom
                                        setTimeout(() => {
                                          const chatContainer = document.querySelector('.chat-messages');
                                          if (chatContainer) {
                                            chatContainer.scrollTop = chatContainer.scrollHeight;
                                          }
                                        }, 100);
                                        
                                        // Handle streaming updates function
                                        const handleStreamingUpdate = (text) => {
                                          setChatMessages(prevMessages => 
                                            prevMessages.map(msg => 
                                              msg.id === regeneratingMessage.id 
                                                ? { ...msg, content: text, isThinking: false } 
                                                : msg
                                            )
                                          );
                                        };
                                        
                                        // Get previous context from the conversation
                                        const conversationContext = chatMessages
                                          .slice(0, userMessageIndex)
                                          .slice(-6) // Get last 6 messages for context
                                          .map(msg => `${msg.sender === 'user' ? 'Student' : 'AI Tutor'}: ${msg.content}`)
                                          .join('\n\n');
                                        
                                        // Generate new response
                                        generateChatResponse(
                                          userMessage.content, 
                                          courseName, 
                                          handleStreamingUpdate,
                                          conversationContext
                                        ).then(responseContent => {
                                          // Update the regenerating message with final content
                                          setChatMessages(prevMessages => 
                                            prevMessages.map(msg => 
                                              msg.id === regeneratingMessage.id 
                                                ? { ...msg, content: responseContent, isThinking: false } 
                                                : msg
                                            )
                                          );
                                          
                                          // Save to chat history with [Regenerated] tag
                                          saveChatHistory(
                                            courseName,
                                            mode,
                                            `[Regenerated] ${userMessage.content}`,
                                            responseContent,
                                            currentSessionId
                                          );
                                        }).catch(error => {
                                          console.error("Error regenerating response:", error);
                                          
                                          // Handle error case
                                          setChatMessages(prevMessages => 
                                            prevMessages.map(msg => 
                                              msg.id === regeneratingMessage.id 
                                                ? { 
                                                    ...msg, 
                                                    content: "I'm sorry, I encountered an error while regenerating this response. Please try again.", 
                                                    isThinking: false 
                                                  } 
                                                : msg
                                            )
                                          );
                                        });
                                      }
                                    }}
                                  >
                                    <IconRefresh size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                        <div ref={chatEndRef} /> {/* Add this empty div for scrolling */}
                      </motion.div>
                    )}
                    
                    {/* Chat Input - Only for chat mode */}
                    {mode === 'chat' && (
                      <motion.div 
                        className="chat-input-wrapper"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                      >
                        <AnimatePresence>
                          {showFilePreview && (
                            <motion.div 
                              className="file-preview-container"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <motion.div 
                                className="file-preview"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                              >
                                {fileType === 'image' && <img src={previewUrl} alt="Preview" />}
                                {fileType === 'pdf' && (
                                  <div className="pdf-preview">
                                    <IconFileText size={48} />
                                    <span>{fileName}</span>
                                  </div>
                                )}
                                <motion.button 
                                  className="cancel-file-button" 
                                  onClick={cancelFileUpload}
                                  whileHover={{ scale: 1.1, backgroundColor: "#ff6b6b" }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <IconTrash size={16} />
                                </motion.button>
                              </motion.div>
                              <div className="file-preview-message">
                                <p>File attached to your message</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        <motion.div 
                          className="chat-input-container"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.3 }}
                        >
                          <motion.label 
                            className="upload-file-button"
                            whileHover={{ scale: 1.1, backgroundColor: "#f0f0f0" }}
                            whileTap={{ scale: 0.95 }}
                            title="Upload image or PDF"
                          >
                            <IconFileText size={20} />
                            <input 
                              type="file" 
                              ref={fileInputRef}
                              accept="image/*,application/pdf" 
                              style={{ display: 'none' }} 
                              onChange={handleFileSelect}
                            />
                          </motion.label>
                          <textarea 
                            className="chat-input"
                            placeholder={selectedFile ? `Message with attached ${fileType}...` : "Ask your question here..."}
                            value={currentMessage}
                            onChange={(e) => setCurrentMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                          ></textarea>
                          <motion.button 
                            className="send-button" 
                            onClick={handleSendMessage}
                            disabled={!currentMessage.trim() && !selectedFile}
                            whileHover={{ scale: 1.05, backgroundColor: "#007bff" }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <IconSend size={20} />
                          </motion.button>
                        </motion.div>
                      </motion.div>
                    )}
                    
                    {/* Quiz Input - Only for quiz mode */}
                    {mode === 'quiz' && (
                      <motion.div 
                        className="quiz-answer-container"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                      >
                        <motion.div 
                          className="quiz-instruction"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.3 }}
                        >
                          <IconQuestionMark size={16} />
                          <span>Type your answer to the question above</span>
                        </motion.div>
                        <motion.div 
                          className="chat-input-container quiz-input-container"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.4, duration: 0.3 }}
                        >
                          <textarea 
                            className="chat-input quiz-input"
                            placeholder="Type your answer here..."
                            value={currentMessage}
                            onChange={(e) => setCurrentMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                          ></textarea>
                          <motion.button 
                            className="submit-answer-button" 
                            onClick={handleSendMessage}
                            disabled={!currentMessage.trim()}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <IconCheck size={20} />
                            <span>Submit Answer</span>
                          </motion.button>
                        </motion.div>
                      </motion.div>
                    )}
                    
                    {/* Resources Grid - Only for resources mode */}
                    {mode === 'resources' && (
                      <motion.div 
                        className="resources-container"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <motion.div 
                          className="resources-filter"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                        >
                          <motion.button 
                            className="filter-button active"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            All Resources
                          </motion.button>
                          <motion.button 
                            className="filter-button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Textbooks
                          </motion.button>
                          <motion.button 
                            className="filter-button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Videos
                          </motion.button>
                          <motion.button 
                            className="filter-button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Exercises
                          </motion.button>
                          <motion.button 
                            className="filter-button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Papers
                          </motion.button>
                        </motion.div>
                        
                        <motion.div 
                          className="resources-grid"
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          <motion.div 
                            className="resource-card"
                            variants={resourceCardVariants}
                            whileHover="hover"
                            whileTap="tap"
                          >
                            <div className="resource-card-icon">📚</div>
                            <h3>{courseName} Fundamentals</h3>
                            <p>Core textbook covering all essential topics</p>
                            <div className="resource-card-actions">
                              <motion.button 
                                className="resource-action-button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <IconDownload size={16} />
                                <span>Download</span>
                              </motion.button>
                              <motion.button 
                                className="resource-action-button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <IconExternalLink size={16} />
                                <span>Open</span>
                              </motion.button>
                            </div>
                          </motion.div>
                          
                          <motion.div 
                            className="resource-card"
                            variants={resourceCardVariants}
                            whileHover="hover"
                            whileTap="tap"
                          >
                            <div className="resource-card-icon">🎥</div>
                            <h3>Video Lectures</h3>
                            <p>Expert-led explanations of key concepts</p>
                            <div className="resource-card-actions">
                              <motion.button 
                                className="resource-action-button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <IconExternalLink size={16} />
                                <span>Watch</span>
                              </motion.button>
                            </div>
                          </motion.div>
                          
                          <motion.div 
                            className="resource-card"
                            variants={resourceCardVariants}
                            whileHover="hover"
                            whileTap="tap"
                          >
                            <div className="resource-card-icon">⚙️</div>
                            <h3>Practice Problems</h3>
                            <p>Interactive exercises to test your knowledge</p>
                            <div className="resource-card-actions">
                              <motion.button 
                                className="resource-action-button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <IconExternalLink size={16} />
                                <span>Practice</span>
                              </motion.button>
                            </div>
                          </motion.div>
                          
                          <motion.div 
                            className="resource-card"
                            variants={resourceCardVariants}
                            whileHover="hover"
                            whileTap="tap"
                          >
                            <div className="resource-card-icon">📝</div>
                            <h3>Study Notes</h3>
                            <p>Comprehensive study materials and summaries</p>
                            <div className="resource-card-actions">
                              <motion.button 
                                className="resource-action-button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <IconDownload size={16} />
                                <span>Download</span>
                              </motion.button>
                            </div>
                          </motion.div>
                          
                          <motion.div 
                            className="resource-card"
                            variants={resourceCardVariants}
                            whileHover="hover"
                            whileTap="tap"
                          >
                            <div className="resource-card-icon">💻</div>
                            <h3>Online Course</h3>
                            <p>Complete self-paced learning module</p>
                            <div className="resource-card-actions">
                              <motion.button 
                                className="resource-action-button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <IconExternalLink size={16} />
                                <span>Enroll</span>
                              </motion.button>
                            </div>
                          </motion.div>
                          
                          <motion.div 
                            className="resource-card"
                            variants={resourceCardVariants}
                            whileHover="hover"
                            whileTap="tap"
                          >
                            <div className="resource-card-icon">🔍</div>
                            <h3>Research Papers</h3>
                            <p>Academic articles for deeper understanding</p>
                            <div className="resource-card-actions">
                              <motion.button 
                                className="resource-action-button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <IconDownload size={16} />
                                <span>View List</span>
                              </motion.button>
                            </div>
                          </motion.div>
                        </motion.div>
                      </motion.div>
                    )}
                    
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      
      {/* Feedback Popup Modal */}
      <AnimatePresence>
        {showFeedbackPopup && (
          <motion.div 
            className="feedback-popup-modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className="feedback-popup-content">
              <h4>Provide Feedback</h4>
              <textarea 
                className="feedback-textarea"
                placeholder="What didn't you like about this response? (optional)"
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
              ></textarea>
              <div className="feedback-popup-actions">
                <button 
                  className="feedback-cancel-button"
                  onClick={() => {
                    setShowFeedbackPopup(false);
                    setFeedbackMessage('');
                    setFeedbackMessageId(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="feedback-submit-button"
                  onClick={() => {
                    // Simulate feedback submission
                    console.log(`Feedback submitted for message ID ${feedbackMessageId}: ${feedbackMessage}`);
                    
                    // Show thank you message
                    setShowFeedbackThanks(true);
                    
                    // Hide popup after 2 seconds
                    setTimeout(() => {
                      setShowFeedbackThanks(false);
                      setShowFeedbackPopup(false);
                      setFeedbackMessage('');
                      setFeedbackMessageId(null);
                    }, 2000);
                  }}
                >
                  Submit
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Feedback Thanks Message */}
      <AnimatePresence>
        {showFeedbackThanks && (
          <motion.div 
            className="feedback-thanks-message"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.1 }}
          >
            <p>Thank you for your feedback!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Like Thanks Message */}
      <AnimatePresence>
        {showLikeThanks && (
          <motion.div 
            className="like-thanks-message"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <p>Thanks for your feedback!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CourseLearningPage;