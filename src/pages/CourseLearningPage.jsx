import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './CourseLearningPage.css';
import Logo from '../assets/logo-white.png';
import { 
  IconCalendar, IconUser, IconBook, IconSettings, IconChartBar, 
  IconClipboard, IconUsers, IconArrowLeft, IconMessageCircle, 
  IconQuestionMark, IconNotebook, IconSend, IconHistory
} from '@tabler/icons-react';
import { getSubjectImageUrl } from '../utils/subjectImageUtils';

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
    setChatMessages([
      {
        sender: 'bot',
        content: `Hi, I'm your ${courseName} tutor. What do you need assistance with today?`,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  // Function to handle starting a quiz
  const handleStartQuiz = () => {
    setMode('quiz');
    setChatMessages([
      {
        sender: 'bot',
        content: `Welcome to the ${courseName} quiz! I'll ask you a series of questions to test your knowledge.`,
        timestamp: new Date().toISOString()
      },
      {
        sender: 'bot',
        content: generateQuizQuestion(),
        timestamp: new Date().toISOString()
      }
    ]);
  };

  // Function to handle starting the learning resources
  const handleStartResources = () => {
    setMode('resources');
    setChatMessages([
      {
        sender: 'bot',
        content: `Here are some learning resources for ${courseName}. These will help you master the subject.`,
        timestamp: new Date().toISOString()
      },
      {
        sender: 'bot',
        content: generateResourcesList(),
        timestamp: new Date().toISOString(),
        isResource: true
      }
    ]);
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

  return (
    <div className="dashboard-page">
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
          <div className="user-profile">
            <span className="user-name">{nickname || 'Guest'}</span>
            <div className="user-avatar">{nickname ? nickname.substring(0, 2).toUpperCase() : 'G'}</div>
          </div>
        </div>
        
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
                <div className="learning-mode-selector">
                  <div className="course-banner">
                    <img src={courseImage} alt={courseName} className="course-banner-image" />
                    <div className="course-banner-overlay">
                      <h2>Welcome to {courseName}</h2>
                      <p>Select a learning mode to begin your personalized education journey</p>
                    </div>
                  </div>
                  
                  <div className="learning-options">
                    <div className="learning-option-card" onClick={handleStartChat}>
                      <div className="option-icon">
                        <IconMessageCircle size={48} />
                      </div>
                      <h3>Ask Questions</h3>
                      <p>Chat with your AI tutor to get answers to your questions</p>
                    </div>
                    
                    <div className="learning-option-card" onClick={handleStartQuiz}>
                      <div className="option-icon">
                        <IconQuestionMark size={48} />
                      </div>
                      <h3>Take a Quiz</h3>
                      <p>Test your knowledge with interactive quizzes</p>
                    </div>
                    
                    <div className="learning-option-card" onClick={handleStartResources}>
                      <div className="option-icon">
                        <IconNotebook size={48} />
                      </div>
                      <h3>Learning Resources</h3>
                      <p>Access curated study materials for this course</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="chat-interface">
                  <div className="chat-header">
                    <div className="chat-title">
                      <h2>
                        {mode === 'chat' ? 'Ask Questions' : 
                         mode === 'quiz' ? 'Knowledge Quiz' : 'Learning Resources'}
                      </h2>
                      <p>{courseName}</p>
                    </div>
                    <button 
                      className={`history-button ${showChatHistory ? 'active' : ''}`}
                      onClick={toggleChatHistory}
                    >
                      <IconHistory size={24} />
                      <span>History</span>
                    </button>
                  </div>
                  
                  {showChatHistory && (
                    <div className="chat-history-panel">
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
                    </div>
                  )}
                  
                  <div className="chat-messages">
                    {chatMessages.map((message, index) => (
                      <div 
                        key={index} 
                        className={`chat-message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
                      >
                        <div className="message-avatar">
                          {message.sender === 'user' 
                            ? (nickname ? nickname.substring(0, 2).toUpperCase() : 'Y') 
                            : courseName.substring(0, 2)
                          }
                        </div>
                        <div className="message-content">
                          {message.isResource 
                            ? message.content 
                            : <p>{message.content}</p>
                          }
                          <span className="message-time">
                            {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {isThinking && (
                      <div className="chat-message bot-message thinking">
                        <div className="message-avatar">{courseName.substring(0, 2)}</div>
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
                  
                  {(mode === 'chat' || mode === 'quiz') && (
                    <div className="chat-input-container">
                      <textarea 
                        className="chat-input"
                        placeholder={mode === 'chat' ? "Ask your question here..." : "Type your answer here..."}
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
                  )}
                  
                  <div className="mode-controls">
                    <button className="mode-control-button" onClick={() => setMode('select')}>
                      <IconArrowLeft size={20} />
                      <span>Back to Menu</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseLearningPage;