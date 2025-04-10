import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import './ChatPage.css'; // Create this CSS file next
import Logo from '../assets/logo-white.png';
import { 
  IconLayoutDashboard, IconMessageCircle, IconBook, IconClipboard, IconCalendar, 
  IconSparkles, IconUser, IconSettings, IconSend, IconPaperclip, 
  IconTrash, IconCopy, IconThumbUp, IconThumbDown, IconRefresh,
  IconFileText, IconPhotoUp, IconX, IconAlertTriangle,
  IconCheck // Added for copy feedback
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { auth, db } from '../../firebase'; // Assuming firebase config is here
import { useUser } from '../context/UserContext'; // To get user nickname
import { useTheme } from '../context/ThemeContext'; // Import useTheme
import { 
  saveChatHistory, 
  getChatHistory, 
  clearChatHistory, 
  getOrCreateSessionId, 
  endCurrentSession,
  getConversationSession,
  forceNewSession,
  updateMessageFeedback
} from '../utils/chatHistoryUtils'; // Assuming chat history utils are here

// --- Animation Variants (Copied from CourseLearningPage for consistency) ---
const containerVariants = { /* ... same as CourseLearningPage ... */ };
const itemVariants = { /* ... same as CourseLearningPage ... */ };
// Add other variants if needed

// --- Gemini AI Setup ---
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Or your preferred model

// --- General Chat System Prompt ---
const generateSystemPrompt = (nickname) => {
  return `You are AdaptIQ, a helpful and friendly AI assistant integrated into a personalized learning platform. The user's nickname is ${nickname || 'Student'}. Engage in general conversation, answer questions, provide explanations, or assist with tasks as requested. Be supportive and maintain a positive tone. Avoid giving educational advice unless specifically asked about a learning topic. Focus on being a general assistant within the AdaptIQ platform.`;
};

const ChatPage = () => {
  const { user } = useUser();
  const { isDarkMode } = useTheme(); // Get theme state
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null); // To scroll to bottom

  // File upload states (similar to CourseLearningPage)
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [fileType, setFileType] = useState(''); // 'image' or 'pdf'
  const [fileName, setFileName] = useState('');
  const [fileExt, setFileExt] = useState('');

  // Chat History State
  const [chatHistory, setChatHistory] = useState([]);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);

  // Feedback State (Copied from CourseLearningPage)
  const [likedMessages, setLikedMessages] = useState({});
  const [dislikedMessages, setDislikedMessages] = useState({});
  const [showLikeThanks, setShowLikeThanks] = useState(false);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackMessageId, setFeedbackMessageId] = useState(null); // Use message timestamp as ID
  const [showFeedbackThanks, setShowFeedbackThanks] = useState(false);

  // Use a constant identifier for general chat history
  const CHAT_CONTEXT_ID = '_general_chat_';

  // Initial message effect
  useEffect(() => {
    // Start a new session when the page loads
    const newSessionId = forceNewSession(CHAT_CONTEXT_ID, 'chat');
    setCurrentSessionId(newSessionId);

    // Load history when component mounts
    loadHistory();
    
  }, [user.nickname]); // Depend on nickname to personalize greeting

  // Scroll to bottom effect
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // --- AI Response Generation (Adapted for General Chat) ---
  const generateChatResponse = async (userMessage, handleStreamingUpdate, context = '', attachedFile = null) => {
    try {
      if (!API_KEY) {
        // Fallback response
        return `I'm currently running in offline mode. How else can I help you?`;
      }

      const systemPrompt = generateSystemPrompt(user.nickname);
      let promptContent = [`${systemPrompt}\n\n${context}\n\nUser: ${userMessage}\n\nAdaptIQ:`];
      let fileAnalysisPrompt = userMessage; // Default prompt

      // Handle file analysis if a file is attached
      if (attachedFile) {
          fileAnalysisPrompt = userMessage.trim() || 
              `Analyze this ${attachedFile.type === 'image' ? 'image' : 'PDF document'} and describe its content or answer my question about it.`;
          promptContent = [`${systemPrompt}\n\nUser: ${fileAnalysisPrompt}\n\nAdaptIQ:`]; // Update prompt for file analysis

          if (attachedFile.type === 'image') {
              const base64Data = attachedFile.preview.split(',')[1];
              const imagePart = {
                  inlineData: { data: base64Data, mimeType: `image/${attachedFile.ext}` }
              };
              promptContent.push(imagePart); // Add image data for Gemini Vision
          } else if (attachedFile.type === 'pdf') {
              // Use the server endpoint for PDF processing
              try {
                  const formData = new FormData();
                  const base64Response = await fetch(attachedFile.preview);
                  const blob = await base64Response.blob();
                  const file = new File([blob], attachedFile.name, { type: 'application/pdf' });
                  
                  formData.append('pdfFile', file);
                  formData.append('prompt', fileAnalysisPrompt); // Send the specific prompt

                  const serverUrl = 'http://localhost:3001/api/process-pdf'; // Ensure your server is running
                  const response = await fetch(serverUrl, { method: 'POST', body: formData });
                  const responseData = await response.json();

                  if (responseData.success) {
                      handleStreamingUpdate(responseData.text); // Update immediately with server response
                      return responseData.text; // Return the full text
                  } else {
                      throw new Error(responseData.message || 'Error processing PDF on server');
                  }
              } catch (pdfError) {
                  console.error("Error processing PDF via server:", pdfError);
                  const errorMsg = `I encountered an error while processing the PDF file: ${pdfError.message}. Please try again or ask without the file.`;
                  handleStreamingUpdate(errorMsg);
                  return errorMsg;
              }
          }
      }

      // Use streaming API for text/image generation
      const streamingResult = await model.generateContentStream(promptContent);
      let responseText = "";
      for await (const chunk of streamingResult.stream) {
          const chunkText = chunk.text();
          responseText += chunkText;
          if (handleStreamingUpdate) {
              handleStreamingUpdate(responseText);
          }
      }
      return responseText;

    } catch (error) {
      console.error("Error generating chat response:", error);
      const errorMsg = `I'm sorry, I encountered an issue. Please try again. Error: ${error.message}`;
      // Update the thinking message with the error
      handleStreamingUpdate(errorMsg); 
      return errorMsg; // Return the error message
    }
  };

  // --- Send Message Handler ---
  const handleSendMessage = async () => {
    const messageToSend = currentMessage.trim();
    const fileToSend = selectedFile ? { ...selectedFile, type: fileType, name: fileName, ext: fileExt, preview: previewUrl } : null;

    if (!messageToSend && !fileToSend) return;

    const newUserMessage = {
      id: Date.now().toString() + '-user',
      sender: 'user',
      content: messageToSend,
      timestamp: new Date().toISOString(),
      file: fileToSend // Include file data if present
    };

    setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
    setCurrentMessage('');

    // Clear file preview after sending
    if (showFilePreview) {
      cancelFileUpload();
    }

    // Add thinking indicator
    const tempBotMessageId = Date.now().toString() + '-bot';
    const tempBotMessage = {
      id: tempBotMessageId,
      sender: 'bot',
      content: '',
      timestamp: new Date().toISOString(),
      isThinking: true
    };
    setChatMessages(prevMessages => [...prevMessages, tempBotMessage]);

    try {
      // Handle streaming updates
      const handleStreamingUpdate = (text) => {
        setChatMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === tempBotMessageId
              ? { ...msg, content: text, isThinking: false } // Update content, remove thinking state
              : msg
          )
        );
      };

      // Get context from previous messages
      const context = chatMessages
        .slice(-6) // Get last 6 messages for context
        .map(msg => `${msg.sender === 'user' ? 'User' : 'AdaptIQ'}: ${msg.content}`)
        .join('\\n\\n');

      // Generate response
      const responseContent = await generateChatResponse(
          messageToSend, 
          handleStreamingUpdate, 
          context,
          newUserMessage.file // Pass the file object
      );

      // Ensure final message update if streaming didn't complete fully
      setChatMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === tempBotMessageId
            ? { ...msg, content: responseContent, isThinking: false }
            : msg
        )
      );

      // Save to chat history
      await saveChatHistory(
        CHAT_CONTEXT_ID, // Use the general context ID
        'chat',
        newUserMessage.file ? `[File: ${newUserMessage.file.name}] ${messageToSend}` : messageToSend,
        responseContent,
        currentSessionId
      );
      
      // Refresh history list if panel is open
      if (showChatHistory) {
          loadHistory();
      }

    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      // Update the thinking message with an error message
      setChatMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === tempBotMessageId
            ? { ...msg, content: `Sorry, an error occurred. Please try again.`, isThinking: false }
            : msg
        )
      );
    }
  };

  // --- Input Key Press Handler ---
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // --- File Handling Functions (Copied and adapted from CourseLearningPage) ---
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      cancelFileUpload(); // Clear previous file
      setSelectedFile(file);
      setFileName(file.name);
      const fileExtension = file.name.split('.').pop().toLowerCase();
      setFileExt(fileExtension);

      if (file.type.startsWith('image/')) {
        setFileType('image');
        const reader = new FileReader();
        reader.onload = (e) => { setPreviewUrl(e.target.result); setShowFilePreview(true); };
        reader.readAsDataURL(file);
      } else if (fileExtension === 'pdf') {
        setFileType('pdf');
        const reader = new FileReader();
        reader.onload = (e) => { setPreviewUrl(e.target.result); setShowFilePreview(true); };
        reader.readAsDataURL(file);
      } else {
        alert("Please select an image (JPEG, PNG) or a PDF file.");
        cancelFileUpload();
      }
    }
  };

  const cancelFileUpload = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setShowFilePreview(false);
    setFileType('');
    setFileName('');
    setFileExt('');
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input
    }
  };

  // --- Chat History Functions ---
   const loadHistory = async () => {
        try {
            const history = await getChatHistory(CHAT_CONTEXT_ID, 'chat');
            setChatHistory(history || []);
        } catch (error) {
            console.error("Error loading chat history:", error);
            setChatHistory([]);
        }
    };

  const toggleChatHistory = () => {
    if (!showChatHistory) {
        loadHistory(); // Refresh history when opening
    }
    setShowChatHistory(!showChatHistory);
  };

  const loadConversationFromHistory = async (historyItem) => {
    setCurrentSessionId(historyItem.sessionId);
    const session = await getConversationSession(CHAT_CONTEXT_ID, 'chat', historyItem.sessionId);
    
    if (session && session.messages && session.messages.length > 0) {
      const formattedMessages = session.messages.map(msg => ({
        id: msg.timestamp + (msg.role === 'user' ? '-user' : '-bot'), // Simple unique ID
        sender: msg.role === 'user' ? 'user' : 'bot',
        content: msg.content,
        timestamp: msg.timestamp,
        // Add file info if present in saved history (needs chatHistoryUtils update)
        // file: msg.file || null 
      }));
      setChatMessages(formattedMessages);
    } else {
      // Fallback if full session isn't available
       const starterMessages = [
        { id: historyItem.timestamp + '-user', sender: 'user', content: historyItem.userMessage, timestamp: historyItem.timestamp },
        { id: historyItem.timestamp + '-bot', sender: 'bot', content: historyItem.botResponse, timestamp: new Date(new Date(historyItem.timestamp).getTime() + 1).toISOString() }
      ];
       setChatMessages(starterMessages);
    }
    setShowChatHistory(false);
  };

  const clearConversationHistory = async () => {
    try {
      await clearChatHistory(CHAT_CONTEXT_ID, 'chat');
      setChatHistory([]);
      setShowChatHistory(false);
      // Optionally clear current chat messages and start fresh
      // setChatMessages([]); 
      // handleStartNewChat(); // Or similar function to reset
      endCurrentSession(CHAT_CONTEXT_ID, 'chat'); // End the session associated with cleared history
      setCurrentSessionId(forceNewSession(CHAT_CONTEXT_ID, 'chat')); // Start a new session ID
       // Add initial bot message again after clearing
        const initialMessage = {
            id: Date.now().toString(),
            sender: 'bot',
            content: `History cleared. How can I help you now, ${user.nickname || 'there'}?`,
            timestamp: new Date().toISOString()
        };
        setChatMessages([initialMessage]);

    } catch (error) {
      console.error("Error clearing conversation history:", error);
    }
    setShowClearHistoryConfirm(false);
  };

  // --- Start New Chat Function ---
  const handleStartNewChat = () => {
      // End the previous session if one exists
      if (currentSessionId) {
          endCurrentSession(CHAT_CONTEXT_ID, 'chat');
      }
      // Force a new session ID
      const newSessionId = forceNewSession(CHAT_CONTEXT_ID, 'chat');
      setCurrentSessionId(newSessionId);
      
      // Clear messages and add initial greeting
      const initialMessage = {
          id: Date.now().toString(),
          sender: 'bot',
          content: `Starting a new chat. Hello ${user.nickname || 'there'}, how can I assist you?`,
          timestamp: new Date().toISOString()
      };
      setChatMessages([initialMessage]);
      
      // Close history panel if open
      setShowChatHistory(false);
  };

  // --- Feedback Handling (Copied from CourseLearningPage) ---
  const handleFeedbackSubmit = () => {
      if (feedbackMessageId && currentSessionId) {
          updateMessageFeedback(
              CHAT_CONTEXT_ID,
              'chat',
              currentSessionId,
              feedbackMessageId, // Use the timestamp stored when dislike was clicked
              { 
                  disliked: true, 
                  liked: false, 
                  feedback_text: feedbackMessage,
                  feedback_inferred: "negative_with_comment"
              }
          ).then(success => {
              console.log("Recorded detailed feedback:", success);
          });
      }
      setShowFeedbackPopup(false);
      setShowFeedbackThanks(true);
      setFeedbackMessage('');
      setFeedbackMessageId(null);
      setTimeout(() => setShowFeedbackThanks(false), 2000);
  };

  // --- Regenerate Response Handler ---
  const handleRegenerateResponse = async (messageToRegenerate) => {
    // Find the user message that preceded the bot message we want to regenerate
    const messageIndex = chatMessages.findIndex(msg => msg.id === messageToRegenerate.id);
    let userMessageIndex = -1;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (chatMessages[i].sender === 'user') {
        userMessageIndex = i;
        break;
      }
    }

    if (userMessageIndex === -1) {
      console.error("Could not find preceding user message to regenerate response.");
      return; // Cannot regenerate without the original user prompt
    }

    const userMessage = chatMessages[userMessageIndex];

    // Record feedback that the original response was regenerated
    if (currentSessionId) {
      updateMessageFeedback(
        CHAT_CONTEXT_ID,
        'chat',
        currentSessionId,
        messageToRegenerate.timestamp,
        { regenerated: true, feedback_inferred: "weak_negative" }
      ).then(success => {
        console.log("Recorded regenerate feedback:", success);
      });
    }

    // Remove the old bot message and any subsequent messages
    const messagesToKeep = chatMessages.slice(0, messageIndex);

    // Add thinking indicator
    const tempBotMessageId = Date.now().toString() + '-bot-regen';
    const tempBotMessage = {
      id: tempBotMessageId,
      sender: 'bot',
      content: '',
      timestamp: new Date().toISOString(),
      isThinking: true
    };
    setChatMessages([...messagesToKeep, tempBotMessage]);

    try {
      // Handle streaming updates
      const handleStreamingUpdate = (text) => {
        setChatMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === tempBotMessageId
              ? { ...msg, content: text, isThinking: false }
              : msg
          )
        );
      };

      // Get context from messages *before* the user message we are responding to
      const context = messagesToKeep
        .slice(0, userMessageIndex) // Context ends before the user message
        .slice(-6) // Get last 6 messages for context
        .map(msg => `${msg.sender === 'user' ? 'User' : 'AdaptIQ'}: ${msg.content}`)
        .join('\\n\\n');

      // Generate new response using the original user message content and file (if any)
      const responseContent = await generateChatResponse(
        userMessage.content,
        handleStreamingUpdate,
        context,
        userMessage.file // Pass the original file object if it existed
      );

      // Ensure final message update
      setChatMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === tempBotMessageId
            ? { ...msg, content: responseContent, isThinking: false }
            : msg
        )
      );

      // Save the *new* exchange to chat history
      await saveChatHistory(
        CHAT_CONTEXT_ID,
        'chat',
        userMessage.file ? `[File: ${userMessage.file.name}] ${userMessage.content}` : userMessage.content,
        responseContent,
        currentSessionId // Use the same session ID
      );

      // Refresh history list if panel is open
      if (showChatHistory) {
        loadHistory();
      }

    } catch (error) {
      console.error("Error regenerating response:", error);
      // Update the thinking message with an error
      setChatMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === tempBotMessageId
            ? { ...msg, content: `Sorry, an error occurred during regeneration. Please try again.`, isThinking: false }
            : msg
        )
      );
    }
  };

  // --- JSX Structure ---
  return (
    <motion.div 
      className={`dashboard-page chat-page-layout ${isDarkMode ? 'dark-theme' : ''}`} // Apply theme class
      initial="hidden" animate="visible" exit="exit" variants={containerVariants}
    >
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <img src={Logo} alt="AdaptIQ Logo" className="dashboard-logo" />
        </div>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item">
            <IconLayoutDashboard size={24} /><span>Overview</span>
          </Link>
          <Link to="/dashboard/chat" className="nav-item active"> {/* Added Chat Link */}
            <IconMessageCircle size={24} /><span>Chat</span>
          </Link>
          <Link to="/dashboard/courses" className="nav-item">
            <IconBook size={24} /><span>Courses</span>
          </Link>
          <Link to="/dashboard/assignments" className="nav-item">
            <IconClipboard size={24} /><span>Assignments</span>
          </Link>
          <Link to="/dashboard/schedule" className="nav-item">
            <IconCalendar size={24} /><span>Schedule</span>
          </Link>
          <Link to="/dashboard/inspiration" className="nav-item">
            <IconSparkles size={24} /><span>Inspiration</span>
          </Link>
          <Link to="/dashboard/profile" className="nav-item">
            <IconUser size={24} /><span>Profile</span>
          </Link>
          <Link to="/dashboard/settings" className="nav-item">
            <IconSettings size={24} /><span>Settings</span>
          </Link>
        </nav>
      </div>

      {/* Main Chat Content Area */}
      <div className="dashboard-content chat-content-area">
        {/* Chat Header */}
         <div className="chat-header">
             <div className="chat-header-left">
                <div className="chat-title">
                    <h2>General Assistant</h2>
                    <p>Ask me anything!</p>
                </div>
             </div>
             <div className="chat-header-actions">
                 <button 
                    className="new-chat-button" 
                    onClick={handleStartNewChat}
                    title="Start New Chat"
                 >
                    <IconRefresh size={18} />
                    <span>New Chat</span>
                 </button>
                 <button 
                    className={`history-button ${showChatHistory ? 'active' : ''}`}
                    onClick={toggleChatHistory}
                    title="View Chat History"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 8v4l3 3" /><path d="M9 17h6" /><path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9 -9 9s-9 -1.8 -9 -9s1.8 -9 9 -9z" /></svg>
                    <span>History</span>
                 </button>
             </div>
         </div>

        {/* Chat History Panel */}
        <AnimatePresence>
          {showChatHistory && (
            <motion.div 
              className="chat-history-panel" // Reuse styling if possible
              initial={{ opacity: 0, x: 300 }} // Slide in from right
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ duration: 0.3 }}
            >
              <div className="history-panel-header">
                <h3>Chat History</h3>
                 <button
                    className="clear-history-header-button"
                    onClick={() => setShowClearHistoryConfirm(true)}
                    aria-label="Clear history"
                    title="Clear All History"
                  >
                    <IconTrash size={16} />
                  </button>
              </div>
              {/* Confirmation Modal */}
                <AnimatePresence>
                  {showClearHistoryConfirm && (
                    <motion.div
                      className="clear-history-confirm-modal" // Reuse styling
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <div className="confirm-modal-content">
                        <IconAlertTriangle size={24} color="#ff4d4d" />
                        <h4>Clear Chat History</h4>
                        <p>Are you sure you want to clear all your general chat history? This cannot be undone.</p>
                        <div className="confirm-modal-buttons">
                          <button className="confirm-cancel-button" onClick={() => setShowClearHistoryConfirm(false)}>Cancel</button>
                          <button className="confirm-delete-button" onClick={clearConversationHistory}>Delete</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              {chatHistory.length > 0 ? (
                <div className="history-list">
                  {chatHistory.map((item, index) => (
                    <div 
                      key={item.sessionId || index} // Use sessionId if available
                      className="history-item"
                      onClick={() => loadConversationFromHistory(item)}
                    >
                       <div className="history-metadata">
                          <span className="history-date">{new Date(item.timestamp).toLocaleDateString()}</span>
                          <span className="history-time">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                       </div>
                       <div className="history-content">
                          <p className="history-question">{item.userMessage.substring(0, 60)}{item.userMessage.length > 60 ? '...' : ''}</p>
                          {/* <p className="history-answer">{item.botResponse.substring(0, 60)}{item.botResponse.length > 60 ? '...' : ''}</p> */}
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-history">No chat history yet.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Messages Area */}
        <motion.div 
            className="chat-messages-container" // Specific class for this page
            variants={containerVariants} initial="hidden" animate="visible" exit="exit"
        >
          {chatMessages.length === 0 && !isThinking && ( // Show welcome only if initial message is the only one
            <motion.div 
              className="chat-welcome-message"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h1>Hello, {user.nickname || 'there'}!</h1>
              <p>How can I assist you today?</p>
            </motion.div>
          )}

          {/* Render actual messages */}
          {chatMessages.map((message, index) => (
            <motion.div
              key={message.id || index} // Use message ID if available
              variants={itemVariants}
              className={`chat-message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
            >
              <div className="message-avatar">
                {message.sender === 'user'
                  ? (user.nickname ? user.nickname.substring(0, 1).toUpperCase() : 'U')
                  : 'AI'}
              </div>
              <div className="message-content">
                {message.isThinking ? (
                  <div className="thinking-indicator"><span></span><span></span><span></span></div>
                ) : (
                  <>
                    {/* Display file if present */}
                    {message.file && (
                      <div className={`message-file-attachment type-${message.file.type}`}>
                        {message.file.type === 'image' && <img src={message.file.preview} alt={message.file.name} className="message-image-preview" />}
                        {message.file.type === 'pdf' && (
                          <div className="message-pdf-preview">
                            <IconFileText size={24} />
                            <span>{message.file.name}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Display text content */}
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  </>
                )}
                 {/* Actions for Bot Messages (Copy, Like, Dislike, Regenerate) */}
                  {message.sender === 'bot' && !message.isThinking && (
                      <div className="message-actions">
                          <button 
                            className="message-action-btn" 
                            title="Copy" 
                            onClick={(e) => { 
                              navigator.clipboard.writeText(message.content);
                              // Visual feedback
                              const button = e.currentTarget;
                              const originalIcon = button.innerHTML;
                              button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>'; // Checkmark icon
                              button.style.color = '#10b981'; // Success color
                              setTimeout(() => {
                                button.innerHTML = originalIcon;
                                button.style.color = ''; // Reset color
                              }, 1500);
                              // Record feedback
                              if (currentSessionId) updateMessageFeedback(CHAT_CONTEXT_ID, 'chat', currentSessionId, message.timestamp, { copied_response: true });
                            }}>
                              <IconCopy size={14} />
                          </button>
                          <button 
                              className={`message-action-btn ${likedMessages[message.id] ? 'liked' : ''}`} 
                              title="Like" 
                              onClick={(e) => { 
                                  setLikedMessages(prev => ({ ...prev, [message.id]: true }));
                                  setDislikedMessages(prev => ({ ...prev, [message.id]: false }));
                                  if (currentSessionId) updateMessageFeedback(CHAT_CONTEXT_ID, 'chat', currentSessionId, message.timestamp, { liked: true, disliked: false, feedback_inferred: "positive" });
                                  setShowLikeThanks(true); setTimeout(() => setShowLikeThanks(false), 1500);
                              }}>
                              <IconThumbUp size={14} />
                          </button>
                          <button 
                              className={`message-action-btn ${dislikedMessages[message.id] ? 'disliked' : ''}`} 
                              title="Dislike" 
                              onClick={(e) => { 
                                  setDislikedMessages(prev => ({ ...prev, [message.id]: true }));
                                  setLikedMessages(prev => ({ ...prev, [message.id]: false }));
                                  setFeedbackMessageId(message.timestamp); // Store timestamp to identify message
                                  if (currentSessionId) updateMessageFeedback(CHAT_CONTEXT_ID, 'chat', currentSessionId, message.timestamp, { disliked: true, liked: false, feedback_inferred: "negative" });
                                  setShowFeedbackPopup(true); 
                              }}>
                              <IconThumbDown size={14} />
                          </button>
                          {/* Regenerate Button */}
                          <button 
                            className="message-action-btn" 
                            title="Regenerate response" 
                            onClick={() => handleRegenerateResponse(message)}
                          >
                             <IconRefresh size={14} />
                          </button>
                      </div>
                  )}
                  {/* Action for User Messages (Copy) */}
                  {message.sender === 'user' && (
                       <div className="message-actions user-message-actions">
                           <button 
                             className="message-action-btn" 
                             title="Copy" 
                             onClick={(e) => { 
                               navigator.clipboard.writeText(message.content);
                               // Visual feedback
                               const button = e.currentTarget;
                               const originalIcon = button.innerHTML;
                               button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>'; // Checkmark icon
                               button.style.color = '#10b981'; // Success color
                               setTimeout(() => {
                                 button.innerHTML = originalIcon;
                                 button.style.color = ''; // Reset color
                               }, 1500);
                             }}>
                               <IconCopy size={14} />
                           </button>
                       </div>
                  )}
              </div>
            </motion.div>
          ))}
          <div ref={chatEndRef} /> {/* Anchor to scroll to */}
        </motion.div>

        {/* Chat Input Area */}
        <motion.div 
            className="chat-input-section" // Specific class
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
        >
          {/* File Preview Area */}
          <AnimatePresence>
            {showFilePreview && (
              <motion.div 
                className="file-preview-container" // Reuse styling
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="file-preview">
                  {fileType === 'image' && <img src={previewUrl} alt="Preview" />}
                  {fileType === 'pdf' && (
                    <div className="pdf-preview-input"> {/* Style this */}
                      <IconFileText size={32} />
                      <span>{fileName}</span>
                    </div>
                  )}
                  <button className="cancel-file-button" onClick={cancelFileUpload} title="Remove file">
                    <IconX size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Bar */}
          <div className="chat-input-bar">
            <label className="chat-attach-button" title="Attach image or PDF">
              <IconPaperclip size={20} />
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </label>
            <textarea
              className="chat-input-field"
              placeholder="Type your message or ask anything..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1} // Auto-resize with CSS
            />
            <button
              className="chat-send-button"
              onClick={handleSendMessage}
              disabled={(!currentMessage.trim() && !selectedFile) || isThinking}
              title="Send message"
            >
              <IconSend size={20} />
            </button>
          </div>
        </motion.div>
      </div>
      
      {/* Feedback Popup Modal (Copied from CourseLearningPage) */}
      <AnimatePresence>
          {showFeedbackPopup && (
              <motion.div className="feedback-popup-modal" /* ... animation ... */>
                  <div className="feedback-popup-content">
                      <h4>Provide Feedback</h4>
                      <textarea 
                          className="feedback-textarea"
                          placeholder="What didn't you like about the response?"
                          value={feedbackMessage}
                          onChange={(e) => setFeedbackMessage(e.target.value)}
                      ></textarea>
                      <div className="feedback-popup-actions">
                          <button className="feedback-cancel-button" onClick={() => { setShowFeedbackPopup(false); setFeedbackMessage(''); setFeedbackMessageId(null); }}>Cancel</button>
                          <button className="feedback-submit-button" onClick={handleFeedbackSubmit}>Submit</button>
                      </div>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
      
      {/* Feedback/Like Thanks Messages (Copied) */}
      <AnimatePresence>{showFeedbackThanks && <motion.div className="feedback-thanks-message" /* ... */>Thank you!</motion.div>}</AnimatePresence>
      <AnimatePresence>{showLikeThanks && <motion.div className="like-thanks-message" /* ... */>Thanks!</motion.div>}</AnimatePresence>

    </motion.div>
  );
};

export default ChatPage;
