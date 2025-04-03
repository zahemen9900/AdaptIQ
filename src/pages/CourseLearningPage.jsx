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
  IconAlertTriangle, IconClock, IconSparkles
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
  forceNewSession
} from '../utils/chatHistoryUtils';
import { getAssignments, formatAssignmentDate } from '../utils/assignmentsUtils';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { auth } from '../../firebase';

// Initialize the Google Generative AI with the API key
// In production, this should be properly handled with environment variables
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
  
  // New state for course assignments
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [courseAssignments, setCourseAssignments] = useState([]);
  
  // State to track whether user data is loaded from Firebase
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);

  // State for confirmation modal
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);

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
      if (!loading && courseName) {
        try {
          // Get all assignments
          const allAssignments = getAssignments();
          
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
  }, [courseName, loading]);

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
      
      // Generate first quiz question using Gemini, related to assignment if possible
      const topic = currentAssignment ? currentAssignment.title.split(':').pop() : '';
      const question = await generateQuizQuestion(courseName, topic);
      
      // Add question to messages
      const questionMessage = {
        sender: 'bot',
        content: question,
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prevMessages => [...prevMessages, questionMessage]);
      
      // This is the first entry we save to history for this session
      await saveChatHistory(
        courseName,
        'quiz',
        'quiz_question',
        questionMessage.content,
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
      
      setChatMessages(prevMessages => [...prevMessages, fallbackMessage]);
      
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
    
    // Return course-specific prompt or a default one
    return coursePrompts[course] || `${basePrompt}As a knowledgeable tutor in ${course}, provide clear, accurate, and helpful responses to student questions. Use examples where appropriate and break down complex concepts into understandable parts.`;
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
  
  // Handle sending a message in chat mode
  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    // Add user message to chat
    const newUserMessage = {
      sender: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
    setCurrentMessage('');
    setIsThinking(true);
    
    try {
      // Get the last bot message if in quiz mode to use as the question
      let question = '';
      if (mode === 'quiz') {
        const lastBotMessage = [...chatMessages].reverse().find(msg => msg.sender === 'bot');
        if (lastBotMessage) {
          question = lastBotMessage.content;
        }
      }
      
      // Add a temporary placeholder for the bot's response
      const tempBotMessageId = Date.now().toString();
      const tempBotMessage = {
        id: tempBotMessageId,
        sender: 'bot',
        content: '',
        timestamp: new Date().toISOString(),
        isStreaming: true
      };
      
      setChatMessages(prevMessages => [...prevMessages, tempBotMessage]);
      
      // Create a function to handle streaming updates
      const handleStreamingUpdate = (text) => {
        setChatMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === tempBotMessageId 
              ? { ...msg, content: text } 
              : msg
          )
        );
      };
      
      // Generate response based on the current mode
      let responseContent = '';
      
      if (mode === 'chat') {
        // Extract conversation context from the recent messages (last 3 turns)
        // This provides the AI with context from previous interactions
        const recentMessages = chatMessages.slice(-6); // Last 3 turns (6 messages max)
        const conversationContext = recentMessages
          .map(msg => `${msg.sender === 'user' ? 'Student' : 'AI Tutor'}: ${msg.content}`)
          .join('\n\n');
          
        responseContent = await generateChatResponse(
          currentMessage, 
          courseName, 
          handleStreamingUpdate,
          conversationContext // Pass the context to maintain conversation continuity
        );
      } else if (mode === 'quiz') {
        responseContent = await evaluateQuizAnswer(currentMessage, question, courseName, handleStreamingUpdate);
      }
      
      // Update the temporary message with the final content and remove streaming flag
      setChatMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === tempBotMessageId 
            ? { ...msg, content: responseContent, isStreaming: false } 
            : msg
        )
      );
      
      // Save to appropriate history collection in Firestore based on mode
      // Using the current session ID to group all messages in the same conversation
      await saveChatHistory(
        courseName,
        mode,
        currentMessage,
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
      // Add fallback error message
      const errorResponse = {
        sender: 'bot',
        content: `I'm sorry, I encountered an issue while processing your request. Please try again later.`,
        timestamp: new Date().toISOString()
      };
      setChatMessages(prevMessages => [...prevMessages, errorResponse]);
    } finally {
      setIsThinking(false);
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
  const [showImagePreview, setShowImagePreview] = useState(false);

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
        setShowImagePreview(true);
      };
      fileReader.readAsDataURL(file);
    }
  };

  // Cancel image upload
  const cancelImageUpload = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setShowImagePreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit image with question
  const submitWithImage = () => {
    if (!currentMessage.trim() && !selectedFile) return;
    
    // Create message content with image
    const newUserMessage = {
      sender: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString(),
      image: previewUrl
    };
    
    setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
    setCurrentMessage('');
    setShowImagePreview(false);
    setSelectedFile(null);
    setPreviewUrl('');
    setIsThinking(true);
    
    // Simulate response from AI tutor
    setTimeout(() => {
      const responseContent = `I've analyzed the image you've shared. ${generateChatResponse('image analysis ' + currentMessage, courseName)}`;
      
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
        `[Image uploaded] ${currentMessage}`,
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
    }, 2000); // Slightly longer for image processing simulation
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

  return (
    <motion.div
      className="dashboard-page"
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
            <IconChartBar size={24} />
            <span>Overview</span>
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
                      <div className="chat-title">
                        <h2>
                          {mode === 'chat' ? 'Ask Questions' : 
                           mode === 'quiz' ? 'Knowledge Quiz' : 'Learning Resources'}
                        </h2>
                        <p>{courseName}</p>
                      </div>
                      <div className="chat-header-actions">
                        <button 
                          className="complete-activity-button" 
                          onClick={() => handleCompleteActivity(mode === 'quiz' ? 10 : 5)}
                        >
                          <IconChartLine size={20} />
                          <span>Complete {mode === 'chat' ? 'Session' : mode === 'quiz' ? 'Quiz' : 'Study'}</span>
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
                              <button
                                className="clear-history-header-button"
                                onClick={() => setShowClearHistoryConfirm(true)}
                                aria-label="Clear history"
                              >
                                <IconTrash size={16} />
                              </button>
                            </div>
                            
                            {/* Confirmation Modal */}
                            <AnimatePresence>
                              {showClearHistoryConfirm && (
                                <motion.div
                                  className="clear-history-confirm-modal"
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="confirm-modal-content">
                                    <IconAlertTriangle size={24} color="#ff4d4d" />
                                    <h4>Clear History</h4>
                                    <p>Are you sure you want to clear all your {mode === 'chat' ? 'conversation' : 'quiz'} history? This action cannot be undone.</p>
                                    <div className="confirm-modal-buttons">
                                      <button 
                                        className="confirm-cancel-button"
                                        onClick={() => setShowClearHistoryConfirm(false)}
                                      >
                                        Cancel
                                      </button>
                                      <button 
                                        className="confirm-delete-button"
                                        onClick={() => {
                                          clearConversationHistory();
                                          setShowClearHistoryConfirm(false);
                                        }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

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
                            key={index}
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
                              {message.isResource ? (
                                message.content 
                              ) : message.image ? (
                                <>
                                  <motion.div 
                                    className="message-image-container"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <img src={message.image} alt="Uploaded content" className="message-image" />
                                  </motion.div>
                                  <p>{message.content}</p>
                                </>
                              ) : (
                                <div className="markdown-content">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {message.content}
                                  </ReactMarkdown>
                                </div>
                              )}
                              <span className="message-time">
                                {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                        
                        {isThinking && (
                          <motion.div 
                            className="chat-message bot-message thinking"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="message-avatar">{mode === 'quiz' ? 'Q' : courseName.substring(0, 2)}</div>
                            <div className="message-content">
                              <div className="thinking-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                              </div>
                            </div>
                          </motion.div>
                        )}
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
                          {showImagePreview && (
                            <motion.div 
                              className="image-preview-container"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <motion.div 
                                className="image-preview"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                              >
                                <img src={previewUrl} alt="Preview" />
                                <motion.button 
                                  className="cancel-image-button" 
                                  onClick={cancelImageUpload}
                                  whileHover={{ scale: 1.1, backgroundColor: "#ff6b6b" }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <IconTrash size={16} />
                                </motion.button>
                              </motion.div>
                              <div className="image-preview-actions">
                                <motion.button 
                                  className="submit-image-button" 
                                  onClick={submitWithImage}
                                  disabled={!selectedFile && !currentMessage.trim()}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <IconSend size={18} />
                                  <span>Send with Image</span>
                                </motion.button>
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
                            className="upload-image-button"
                            whileHover={{ scale: 1.1, backgroundColor: "#f0f0f0" }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <IconPhotoUp size={20} />
                            <input 
                              type="file" 
                              ref={fileInputRef}
                              accept="image/*" 
                              style={{ display: 'none' }} 
                              onChange={handleFileSelect}
                            />
                          </motion.label>
                          <textarea 
                            className="chat-input"
                            placeholder="Ask your question here..."
                            value={currentMessage}
                            onChange={(e) => setCurrentMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                          ></textarea>
                          <motion.button 
                            className="send-button" 
                            onClick={handleSendMessage}
                            disabled={!currentMessage.trim()}
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
                    
                    <div className="mode-controls">
                      <motion.button 
                        className="mode-control-button" 
                        onClick={() => {
                          // End the current session before returning to menu
                          endCurrentSession(courseName, mode);
                          setCurrentSessionId(null);
                          setMode('select');
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <IconArrowLeft size={20} />
                        <span>Back to Menu</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CourseLearningPage;