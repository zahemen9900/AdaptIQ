import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import './CourseLearningPage.css';
import Logo from '../assets/logo-white.png';
import { 
  IconCalendar, IconUser, IconBook, IconSettings, IconChartBar, 
  IconClipboard, IconUsers, IconArrowLeft, IconMessageCircle, 
  IconQuestionMark, IconNotebook, IconSend, IconHistory,
  IconChartLine, IconActivity, IconRefresh, IconPhotoUp,
  IconTrash, IconCheck, IconX, IconDownload, IconExternalLink
} from '@tabler/icons-react';
import { getSubjectImageUrl } from '../utils/subjectImageUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getProgressFromFirebase, 
  updateProgressInFirebase, 
  incrementProgress,
  getActivityHistory
} from '../utils/progressTracker';

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
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activityHistory, setActivityHistory] = useState([]);
  const [showProgressPopup, setShowProgressPopup] = useState(false);
  const [progressAnimation, setProgressAnimation] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(false);
  const fileInputRef = useRef(null);

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
  }, [courseName, loading]);

  // Update progress when completing activities
  const handleCompleteActivity = useCallback(async (incrementAmount = 5) => {
    try {
      // Trigger animation before updating the value
      setProgressAnimation(true);
      
      // Update progress in Firebase (mock)
      const newProgress = await incrementProgress(courseName, incrementAmount);
      
      // Wait for animation to start before updating value
      setTimeout(() => {
        setProgress(newProgress);
        
        // Show success popup
        setShowProgressPopup(true);
        
        // Hide popup after 3 seconds
        setTimeout(() => {
          setShowProgressPopup(false);
          setProgressAnimation(false);
        }, 3000);
      }, 300);
      
      // Add to activity history
      const newActivity = {
        id: Date.now(),
        type: mode,
        name: `${mode === 'chat' ? 'Tutor Session' : mode === 'quiz' ? 'Quiz Completion' : 'Resource Study'}`,
        date: new Date(),
        score: mode === 'quiz' ? Math.floor(70 + Math.random() * 30) : null // Random score for quizzes
      };
      
      setActivityHistory(prev => [newActivity, ...prev]);
      
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
    // Add initial tutor message
    setChatMessages([{
      sender: 'bot',
      content: `Hi, I'm your ${courseName} tutor. What do you need assistance with today?`,
      timestamp: new Date().toISOString()
    }]);
  };

  // Function to handle starting a quiz
  const handleStartQuiz = () => {
    setMode('quiz');
    setChatMessages([{
      sender: 'bot',
      content: `Welcome to the ${courseName} quiz! I'll ask you a series of questions to test your knowledge.`,
      timestamp: new Date().toISOString()
    },
    {
      sender: 'bot',
      content: generateQuizQuestion(),
      timestamp: new Date().toISOString()
    }]);
  };

  // Function to handle starting the learning resources
  const handleStartResources = () => {
    setMode('resources');
    setChatMessages([{
      sender: 'bot',
      content: `Here are some learning resources for ${courseName}. These will help you master the subject.`,
      timestamp: new Date().toISOString()
    },
    {
      sender: 'bot',
      content: generateResourcesList(),
      timestamp: new Date().toISOString(),
      isResource: true
    }]);
  };

  // Generate a sample quiz question based on the course
  const generateQuizQuestion = () => {
    const quizQuestions = {
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
      'Cognitive Psychology': 'Explain the concept of working memory.'
    };
    
    return quizQuestions[courseName] || `What is one key concept you've learned in ${courseName}?`;
  };

  // Generate sample resources for the course
  const generateResourcesList = () => {
    const resourceTypes = [
      { title: "Recommended Textbooks", icon: "📚" },
      { title: "Video Lectures", icon: "🎥" },
      { title: "Interactive Exercises", icon: "⚙️" },
      { title: "Academic Papers", icon: "📝" },
      { title: "Online Courses", icon: "💻" }
    ];
    
    return (
      <div className="resources-list">
        {resourceTypes.map((resource, index) => (
          <div key={index} className="resource-item">
            <div className="resource-icon">{resource.icon}</div>
            <div className="resource-content">
              <h3>{resource.title}</h3>
              <p>Top {courseName} materials selected for your learning style.</p>
              <button className="resource-explore-btn">Explore</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Handle sending a message in chat mode
  const handleSendMessage = () => {
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
    
    // Simulate response from Firebase ML (replace with actual API call)
    setTimeout(() => {
      const systemPrompt = generateSystemPrompt(courseName);
      console.log("System prompt:", systemPrompt);
      
      // Generate a response based on the current mode
      let responseContent = '';
      
      if (mode === 'chat') {
        responseContent = generateChatResponse(currentMessage, courseName);
      } else if (mode === 'quiz') {
        responseContent = evaluateQuizAnswer(currentMessage, courseName);
      }
      
      const botResponse = {
        sender: 'bot',
        content: responseContent,
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prevMessages => [...prevMessages, botResponse]);
      setIsThinking(false);
      
      // Save to chat history
      const newHistoryItem = {
        courseName,
        timestamp: new Date().toISOString(),
        userMessage: currentMessage,
        botResponse: responseContent
      };
      
      const updatedHistory = [newHistoryItem, ...chatHistory.slice(0, 19)]; // Keep only latest 20 items
      setChatHistory(updatedHistory);
      localStorage.setItem(`chatHistory_${courseName}`, JSON.stringify(updatedHistory));
    }, 1500);
  };

  // Generate dynamic system prompt based on course
  const generateSystemPrompt = (course) => {
    const prompts = {
      'Algebra': "You are a mathematics tutor specializing in Algebra. Use clear explanations with step-by-step reasoning. Remember that Algebra covers equations, variables, functions, and expressions. Provide visual representations when possible.",
      'Geometry': "You are a Geometry tutor. Always include diagrams in your explanations when describing shapes, and provide proofs when necessary. Cover topics like angles, triangles, polygons, circles, and coordinate geometry.",
      'Physics': "You are a Physics tutor. Explain concepts with both mathematical formulas and intuitive real-world examples. Remember to clarify the units and dimensions in your answers.",
      'Programming': "You are a Programming tutor. Provide code examples in your explanations and ensure your code is correct and follows best practices. Explain the logic behind programming concepts clearly.",
      'Web Development': "You are a Web Development tutor. Provide code examples using HTML, CSS, and JavaScript where appropriate. Explain both frontend and backend concepts clearly and offer practical tips.",
      'General Psychology': "You are a Psychology tutor specializing in general concepts. Explain psychological theories, research methods, and key studies. Use clear examples and avoid clinical diagnoses."
    };
    
    return prompts[course] || `You are a knowledgeable tutor in ${course}. Provide clear, accurate, and helpful responses to student questions. Use examples where appropriate and break down complex concepts into understandable parts.`;
  };

  // Generate a sample chat response (mock for Firebase ML)
  const generateChatResponse = (userMessage, course) => {
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
    
    return simpleResponses[course] || `That's an interesting question about ${course}. Let me explain this concept clearly. The main principles involve [key concepts] which apply in situations like [examples]. Does that help clarify things?`;
  };

  // Evaluate a quiz answer (mock for Firebase ML)
  const evaluateQuizAnswer = (answer, course) => {
    // This would be replaced with actual answer evaluation logic
    return `Thanks for your answer! Here's some feedback: [detailed explanation of the correct approach]. Would you like to try another question?`;
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
      
      // Save to chat history
      const newHistoryItem = {
        courseName,
        timestamp: new Date().toISOString(),
        userMessage: currentMessage + ' [Image attached]',
        botResponse: responseContent
      };
      
      const updatedHistory = [newHistoryItem, ...chatHistory.slice(0, 19)];
      setChatHistory(updatedHistory);
      localStorage.setItem(`chatHistory_${courseName}`, JSON.stringify(updatedHistory));
    }, 2000); // Slightly longer for image processing simulation
  };

  return (
    <motion.div
      className="dashboard-page"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.5 }}
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
          <Link to="/dashboard/study-groups" className="nav-item">
            <IconUsers size={24} />
            <span>Study Groups</span>
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
        
        {/* Progress Bar */}
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
              {mode === 'select' ? (
                <motion.div 
                  className="learning-mode-selector"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
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
                      whileHover={{ y: -10 }}
                      transition={{ type: "spring", stiffness: 300 }}
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
                      whileHover={{ y: -10 }}
                      transition={{ type: "spring", stiffness: 300 }}
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
                      whileHover={{ y: -10 }}
                      transition={{ type: "spring", stiffness: 300 }}
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
                  className="chat-interface"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
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
                      <button 
                        className={`history-button ${showChatHistory ? 'active' : ''}`}
                        onClick={toggleChatHistory}
                      >
                        <IconHistory size={20} />
                        <span>History</span>
                      </button>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {showChatHistory && (
                      <motion.div 
                        className="chat-history-panel"
                        initial={{ opacity: 0, x: 320 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 320 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h3>Recent Conversations</h3>
                        {chatHistory.length > 0 ? (
                          <div className="history-list">
                            {chatHistory.map((item, index) => (
                              <div key={index} className="history-item">
                                <div className="history-metadata">
                                  <span className="history-date">
                                    {new Date(item.timestamp).toLocaleDateString()}
                                  </span>
                                  <span className="history-time">
                                    {new Date(item.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                                <div className="history-content">
                                  <p className="history-question">{item.userMessage}</p>
                                  <p className="history-answer">{typeof item.botResponse === 'string' ? item.botResponse.substring(0, 60) + (item.botResponse.length > 60 ? '...' : '') : 'Complex response...'}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-history">No conversation history yet</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="chat-messages">
                    {chatMessages.map((message, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
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
                              <div className="message-image-container">
                                <img src={message.image} alt="Uploaded content" className="message-image" />
                              </div>
                              <p>{message.content}</p>
                            </>
                          ) : (
                            <p>{message.content}</p>
                          )}
                          <span className="message-time">
                            {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                    
                    {isThinking && (
                      <div className="chat-message bot-message thinking">
                        <div className="message-avatar">{mode === 'quiz' ? 'Q' : courseName.substring(0, 2)}</div>
                        <div className="message-content">
                          <div className="thinking-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {mode === 'chat' && (
                    <div className="chat-input-wrapper">
                      {showImagePreview && (
                        <div className="image-preview-container">
                          <div className="image-preview">
                            <img src={previewUrl} alt="Preview" />
                            <button className="cancel-image-button" onClick={cancelImageUpload}>
                              <IconTrash size={16} />
                            </button>
                          </div>
                          <div className="image-preview-actions">
                            <button 
                              className="submit-image-button" 
                              onClick={submitWithImage}
                              disabled={!selectedFile && !currentMessage.trim()}
                            >
                              <IconSend size={18} />
                              <span>Send with Image</span>
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <div className="chat-input-container">
                        <label className="upload-image-button">
                          <IconPhotoUp size={20} />
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            accept="image/*" 
                            style={{ display: 'none' }} 
                            onChange={handleFileSelect}
                          />
                        </label>
                        <textarea 
                          className="chat-input"
                          placeholder="Ask your question here..."
                          value={currentMessage}
                          onChange={(e) => setCurrentMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                        ></textarea>
                        <button 
                          className="send-button" 
                          onClick={handleSendMessage}
                          disabled={!currentMessage.trim()}
                        >
                          <IconSend size={20} />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {mode === 'quiz' && (
                    <div className="quiz-answer-container">
                      <div className="quiz-instruction">
                        <IconQuestionMark size={16} />
                        <span>Type your answer to the question above</span>
                      </div>
                      <div className="chat-input-container quiz-input-container">
                        <textarea 
                          className="chat-input quiz-input"
                          placeholder="Type your answer here..."
                          value={currentMessage}
                          onChange={(e) => setCurrentMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                        ></textarea>
                        <button 
                          className="submit-answer-button" 
                          onClick={handleSendMessage}
                          disabled={!currentMessage.trim()}
                        >
                          <IconCheck size={20} />
                          <span>Submit Answer</span>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {mode === 'resources' && (
                    <div className="resources-container">
                      <div className="resources-filter">
                        <button className="filter-button active">All Resources</button>
                        <button className="filter-button">Textbooks</button>
                        <button className="filter-button">Videos</button>
                        <button className="filter-button">Exercises</button>
                        <button className="filter-button">Papers</button>
                      </div>
                      
                      <div className="resources-grid">
                        <div className="resource-card">
                          <div className="resource-card-icon">📚</div>
                          <h3>{courseName} Fundamentals</h3>
                          <p>Core textbook covering all essential topics</p>
                          <div className="resource-card-actions">
                            <button className="resource-action-button">
                              <IconDownload size={16} />
                              <span>Download</span>
                            </button>
                            <button className="resource-action-button">
                              <IconExternalLink size={16} />
                              <span>Open</span>
                            </button>
                          </div>
                        </div>
                        
                        <div className="resource-card">
                          <div className="resource-card-icon">🎥</div>
                          <h3>Video Lectures</h3>
                          <p>Expert-led explanations of key concepts</p>
                          <div className="resource-card-actions">
                            <button className="resource-action-button">
                              <IconExternalLink size={16} />
                              <span>Watch</span>
                            </button>
                          </div>
                        </div>
                        
                        <div className="resource-card">
                          <div className="resource-card-icon">⚙️</div>
                          <h3>Practice Problems</h3>
                          <p>Interactive exercises to test your knowledge</p>
                          <div className="resource-card-actions">
                            <button className="resource-action-button">
                              <IconExternalLink size={16} />
                              <span>Practice</span>
                            </button>
                          </div>
                        </div>
                        
                        <div className="resource-card">
                          <div className="resource-card-icon">📝</div>
                          <h3>Study Notes</h3>
                          <p>Comprehensive study materials and summaries</p>
                          <div className="resource-card-actions">
                            <button className="resource-action-button">
                              <IconDownload size={16} />
                              <span>Download</span>
                            </button>
                          </div>
                        </div>
                        
                        <div className="resource-card">
                          <div className="resource-card-icon">💻</div>
                          <h3>Online Course</h3>
                          <p>Complete self-paced learning module</p>
                          <div className="resource-card-actions">
                            <button className="resource-action-button">
                              <IconExternalLink size={16} />
                              <span>Enroll</span>
                            </button>
                          </div>
                        </div>
                        
                        <div className="resource-card">
                          <div className="resource-card-icon">🔍</div>
                          <h3>Research Papers</h3>
                          <p>Academic articles for deeper understanding</p>
                          <div className="resource-card-actions">
                            <button className="resource-action-button">
                              <IconDownload size={16} />
                              <span>View List</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CourseLearningPage;