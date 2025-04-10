// Chat and quiz history utilities for AdaptIQ
import { auth, db } from '../../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
  serverTimestamp,
  increment
} from 'firebase/firestore';

/**
 * Generate a unique session ID
 * @returns {string} - A unique session ID
 */
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Add feedback data to message object
 * @param {Object} messageObj - The message object to add feedback to
 * @returns {Object} - Message object with feedback data
 */
const addFeedbackData = (messageObj) => {
  // Only add feedback to assistant messages
  if (messageObj.role === 'assistant') {
    return {
      ...messageObj,
      feedback: {
        liked: false,
        disliked: false,
        regenerated: false,
        copied_response: false,
        text_feedback: null,
        feedback_inferred: "neutral"
      }
    };
  }
  return messageObj;
};

/**
 * Infer feedback sentiment based on user interactions
 * @param {Object} feedbackObj - The feedback object
 * @returns {string} - Inferred feedback sentiment
 */
const inferFeedbackSentiment = (feedbackObj) => {
  if (feedbackObj.liked) return "positive";
  if (feedbackObj.disliked) return "negative";
  if (feedbackObj.regenerated) return "weak_negative";
  if (feedbackObj.copied_response) return "positive";
  return "neutral";
};

/**
 * Get or create a session ID for the current conversation
 * @param {string} contextId - The context identifier (e.g., course name or '_general_chat_')
 * @param {string} mode - The learning mode ('chat'/'quiz')
 * @param {boolean} forceNew - Whether to force creation of a new session ID
 * @returns {string} - The session ID
 */
export const getOrCreateSessionId = (contextId, mode, forceNew = false) => {
  const sessionKey = `${mode}_session_${contextId}`;
  let sessionId = localStorage.getItem(sessionKey);
  
  // Create a new session ID if none exists or if forced to create a new one
  if (!sessionId || forceNew) {
    sessionId = generateSessionId();
    localStorage.setItem(sessionKey, sessionId);
  }
  
  return sessionId;
};

/**
 * Force creation of a new session ID regardless of any existing one
 * This ensures each conversation is truly separate
 * @param {string} contextId - The context identifier
 * @param {string} mode - The learning mode ('chat'/'quiz')
 * @returns {string} - A new session ID
 */
export const forceNewSession = (contextId, mode) => {
  const sessionKey = `${mode}_session_${contextId}`;
  // Always generate a new session ID
  const newSessionId = generateSessionId();
  // Store it in localStorage
  localStorage.setItem(sessionKey, newSessionId);
  return newSessionId;
};

/**
 * End the current session
 * @param {string} contextId - The context identifier
 * @param {string} mode - The learning mode ('chat'/'quiz')
 */
export const endCurrentSession = (contextId, mode) => {
  const sessionKey = `${mode}_session_${contextId}`;
  localStorage.removeItem(sessionKey);
};

/**
 * Save a chat conversation to Firebase (and localStorage as fallback)
 * 
 * @param {string} contextId - The context identifier (e.g., course name or '_general_chat_')
 * @param {string} mode - The learning mode ('chat'/'quiz')
 * @param {string} userMessage - The user's message
 * @param {string} botResponse - The bot's response
 * @param {string} [sessionId] - Optional session ID to group conversation turns
 * @returns {Promise<Object|null>} - The saved conversation object or null on error
 */
export const saveChatHistory = async (contextId, mode, userMessage, botResponse, sessionId) => {
  try {
    // Get or create session ID
    const currentSessionId = sessionId || getOrCreateSessionId(contextId, mode);
    
    // Create message objects
    const userMessageObj = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    
    const botMessageObj = addFeedbackData({
      role: 'assistant',
      content: botResponse,
      timestamp: new Date().toISOString()
    });
    
    // Save to localStorage first
    await addMessageToSession(contextId, mode, currentSessionId, userMessageObj, botMessageObj);
    
    // If user is authenticated, save to Firebase
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      // Use contextId directly as the document ID within a 'contexts' collection
      // Or keep the 'courses' structure and use contextId as the courseId
      // Let's stick to the 'courses' structure for simplicity, using contextId as the key
      const firestoreContextId = contextId.toLowerCase().replace(/ /g, '-');
      
      // Determine which collection to use based on mode
      const collectionName = mode === 'quiz' ? 'quizSessions' : 'chatSessions';
      
      // Path: users/{userId}/courses/{firestoreContextId}/{collectionName}
      const sessionsRef = collection(db, "users", userId, "courses", firestoreContextId, collectionName);
      const sessionQuery = query(sessionsRef, where("sessionId", "==", currentSessionId));
      const sessionSnapshot = await getDocs(sessionQuery);
      
      if (sessionSnapshot.empty) {
        // Create new session document
        const title = userMessage.length > 30 ? userMessage.substring(0, 30) + '...' : userMessage;
        const newSessionData = {
          userId,
          courseId: firestoreContextId, // Store the contextId here
          courseName: contextId, // Store original contextId as name
          mode,
          sessionId: currentSessionId,
          messages: [userMessageObj, botMessageObj],
          timestamp: serverTimestamp(),
          lastUpdated: serverTimestamp(),
          title
        };
        
        await addDoc(sessionsRef, newSessionData);
      } else {
        // Update existing session document with new messages
        const sessionDoc = sessionSnapshot.docs[0];
        await updateDoc(sessionDoc.ref, {
          messages: arrayUnion(userMessageObj, botMessageObj),
          lastUpdated: serverTimestamp()
        });
      }
      
      // Update the context document (e.g., course or general chat) to reflect recent activity
      const contextRef = doc(db, "users", userId, "courses", firestoreContextId);
      // Ensure the context document exists
      const contextDoc = await getDoc(contextRef);
      if (!contextDoc.exists()) {
          await setDoc(contextRef, {
              courseName: contextId, // Use original contextId
              courseId: firestoreContextId,
              lastUpdated: serverTimestamp(),
              dateCreated: serverTimestamp()
          }, { merge: true });
      }
      await updateDoc(contextRef, {
        [`last${mode.charAt(0).toUpperCase() + mode.slice(1)}Activity`]: serverTimestamp(),
        lastActive: serverTimestamp()
      }, { merge: true });
    }
    
    // Return the session ID for future use
    return {
      sessionId: currentSessionId,
      userMessage,
      botResponse
    };

  } catch (error) {
    console.error(`Error saving chat history:`, error);
    return null;
  }
};

/**
 * Add messages to a conversation session in localStorage
 * @param {string} contextId - The context identifier
 * @param {string} mode - The learning mode ('chat' or 'quiz')
 * @param {string} sessionId - The session ID
 * @param {Object} userMessage - The user message object
 * @param {Object} botMessage - The bot message object
 */
const addMessageToSession = async (contextId, mode, sessionId, userMessage, botMessage) => {
  try {
    const key = `${mode}Sessions_${contextId}`;
    const storedSessions = localStorage.getItem(key);
    const sessions = storedSessions ? JSON.parse(storedSessions) : [];
    
    // Find the session
    const sessionIndex = sessions.findIndex(s => s.sessionId === sessionId);
    
    if (sessionIndex >= 0) {
      // Add messages to existing session
      sessions[sessionIndex].messages.push(userMessage);
      sessions[sessionIndex].messages.push(botMessage);
      sessions[sessionIndex].lastUpdated = new Date().toISOString();
    } else {
      // Create new session
      const title = userMessage.content.length > 30 ? userMessage.content.substring(0, 30) + '...' : userMessage.content;
      sessions.unshift({
        sessionId,
        courseName: contextId,
        mode,
        title,
        messages: [userMessage, botMessage],
        timestamp: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }
    
    // Keep only the latest 20 sessions
    if (sessions.length > 20) {
      sessions.length = 20;
    }
    
    localStorage.setItem(key, JSON.stringify(sessions));
  } catch (error) {
    console.error(`Error adding messages to session in localStorage:`, error);
  }
};

/**
 * Update feedback data for a specific message
 * @param {string} contextId - The context identifier
 * @param {string} mode - The learning mode ('chat' or 'quiz')
 * @param {string} sessionId - The session ID
 * @param {string} messageTimestamp - The timestamp of the message to update
 * @param {Object} feedbackUpdate - The feedback data to update
 * @returns {Promise<boolean>} - Success status
 */
export const updateMessageFeedback = async (contextId, mode, sessionId, messageTimestamp, feedbackUpdate) => {
  try {
    // First update in localStorage
    const key = `${mode}Sessions_${contextId}`;
    const storedSessions = localStorage.getItem(key);
    
    if (storedSessions) {
      const sessions = JSON.parse(storedSessions);
      const sessionIndex = sessions.findIndex(s => s.sessionId === sessionId);
      
      if (sessionIndex >= 0) {
        const session = sessions[sessionIndex];
        const messageIndex = session.messages.findIndex(m => 
          m.role === 'assistant' && m.timestamp === messageTimestamp
        );
        
        if (messageIndex >= 0) {
          // Update feedback data
          const message = session.messages[messageIndex];
          const updatedFeedback = {
            ...message.feedback || {
              liked: false,
              disliked: false,
              regenerated: false,
              copied_response: false,
              text_feedback: null,
              feedback_inferred: "neutral"
            },
            ...feedbackUpdate
          };
          
          // Infer sentiment from interactions
          updatedFeedback.feedback_inferred = inferFeedbackSentiment(updatedFeedback);
          
          // Update message
          session.messages[messageIndex] = {
            ...message,
            feedback: updatedFeedback
          };
          
          // Save back to localStorage
          localStorage.setItem(key, JSON.stringify(sessions));
        }
      }
    }
    
    // If user is authenticated, update in Firebase
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      const firestoreContextId = contextId.toLowerCase().replace(/ /g, '-');
      
      // Determine which collection to use
      const collectionName = mode === 'quiz' ? 'quizSessions' : 'chatSessions';
      
      // Query for the session
      const sessionsRef = collection(db, "users", userId, "courses", firestoreContextId, collectionName);
      const sessionQuery = query(sessionsRef, where("sessionId", "==", sessionId));
      const sessionSnapshot = await getDocs(sessionQuery);
      
      if (!sessionSnapshot.empty) {
        const sessionDoc = sessionSnapshot.docs[0];
        const sessionData = sessionDoc.data();
        
        // Find the message to update
        if (sessionData.messages && Array.isArray(sessionData.messages)) {
          const messageIndex = sessionData.messages.findIndex(m => 
            m.role === 'assistant' && m.timestamp === messageTimestamp
          );
          
          if (messageIndex >= 0) {
            // Update the message's feedback
            const message = sessionData.messages[messageIndex];
            const updatedFeedback = {
              ...message.feedback || {
                liked: false,
                disliked: false,
                regenerated: false,
                copied_response: false,
                text_feedback: null,
                feedback_inferred: "neutral"
              },
              ...feedbackUpdate
            };
            
            // Infer sentiment
            updatedFeedback.feedback_inferred = inferFeedbackSentiment(updatedFeedback);
            
            // Create updated messages array
            const updatedMessages = [...sessionData.messages];
            updatedMessages[messageIndex] = {
              ...message,
              feedback: updatedFeedback
            };
            
            // Update the document
            await updateDoc(sessionDoc.ref, {
              messages: updatedMessages,
              lastUpdated: serverTimestamp()
            });
            
            // If it's important feedback (liked or disliked), also update a counter
            if (feedbackUpdate.liked || feedbackUpdate.disliked) {
              const feedbackType = feedbackUpdate.liked ? 'positive' : 'negative';
              await updateDoc(sessionDoc.ref, {
                [`feedbackStats.${feedbackType}`]: increment(1)
              });
            }
          }
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating message feedback:', error);
    return false;
  }
};

/**
 * Get chat or quiz history for a context from Firebase
 * @param {string} contextId - The context identifier
 * @param {string} [mode='chat'] - The learning mode ('chat' or 'quiz'), defaults to 'chat'
 * @param {number} [maxItems=20] - Maximum number of items to return
 * @returns {Promise<Array>} - Array of conversation session objects
 */
export const getChatHistory = async (contextId, mode = 'chat', maxItems = 20) => {
  try {
    // Check if user is authenticated
    if (!auth.currentUser) {
      console.warn("No user signed in, using localStorage fallback");
      return getSessionsFromLocalStorage(contextId, mode);
    }

    const userId = auth.currentUser.uid;
    const firestoreContextId = contextId.toLowerCase().replace(/ /g, '-');
    
    // Determine which collection to query based on mode
    const collectionName = mode === 'quiz' ? 'quizSessions' : 'chatSessions';
    
    // Initialize or get context document if it doesn't exist
    const contextRef = doc(db, "users", userId, "courses", firestoreContextId);
    const contextDoc = await getDoc(contextRef);
    
    if (!contextDoc.exists()) {
      // Create the context document if it doesn't exist
      await setDoc(contextRef, {
        courseName: contextId, // Use original contextId
        courseId: firestoreContextId,
        progress: 0, // Default progress for contexts
        lastUpdated: serverTimestamp(),
        dateCreated: serverTimestamp()
      });
    }
    
    // Query Firestore for conversation history
    const sessionsRef = collection(db, "users", userId, "courses", firestoreContextId, collectionName);
    const sessionsQuery = query(
      sessionsRef,
      orderBy("lastUpdated", "desc"),
      limit(maxItems)
    );
    
    const querySnapshot = await getDocs(sessionsQuery);
    
    // Convert query results to array
    const sessions = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Get first user message for backwards compatibility
      const firstUserMessage = data.messages?.find(m => m.role === 'user')?.content || '';
      // Get first bot message for backwards compatibility
      const firstBotMessage = data.messages?.find(m => m.role === 'assistant')?.content || '';
      
      sessions.push({
        id: doc.id,
        sessionId: data.sessionId,
        courseName: data.courseName,
        timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
        lastUpdated: data.lastUpdated ? data.lastUpdated.toDate().toISOString() : new Date().toISOString(),
        title: data.title || firstUserMessage.substring(0, 30) + '...',
        userMessage: firstUserMessage, // For backwards compatibility
        botResponse: firstBotMessage, // For backwards compatibility
        messages: data.messages || [],
        mode: data.mode || mode
      });
    });
    
    if (sessions.length === 0) {
      // If no sessions in Firestore, check localStorage
      const localSessions = getSessionsFromLocalStorage(contextId, mode);
      
      // If there's local session data, sync it to Firebase
      if (localSessions.length > 0) {
        for (const session of localSessions) {
          // Only sync complete sessions
          if (session.messages && session.messages.length >= 2) {
            const newSessionData = {
              userId,
              courseId: firestoreContextId,
              courseName: contextId,
              mode: session.mode || mode,
              sessionId: session.sessionId,
              messages: session.messages,
              timestamp: new Date(session.timestamp),
              lastUpdated: new Date(session.lastUpdated || session.timestamp),
              title: session.title || session.userMessage?.substring(0, 30) + '...'
            };
            
            await addDoc(sessionsRef, newSessionData);
          }
        }
        
        return localSessions;
      }
    }
    
    return sessions;
  } catch (error) {
    console.error(`Error fetching ${mode} history from Firebase:`, error);
    return getSessionsFromLocalStorage(contextId, mode);
  }
};

/**
 * Get combined history for both chat and quiz modes for a context
 * @param {string} contextId - The context identifier
 * @param {number} [maxItems=20] - Maximum number of items to return from each mode
 * @returns {Promise<Object>} - Object with chat and quiz history arrays
 */
export const getAllChatHistory = async (contextId, maxItems = 20) => {
  try {
    const chatSessions = await getChatHistory(contextId, 'chat', maxItems);
    const quizSessions = await getChatHistory(contextId, 'quiz', maxItems);
    
    return {
      chat: chatSessions,
      quiz: quizSessions
    };
  } catch (error) {
    console.error(`Error fetching all chat history:`, error);
    return {
      chat: getSessionsFromLocalStorage(contextId, 'chat'),
      quiz: getSessionsFromLocalStorage(contextId, 'quiz')
    };
  }
};

/**
 * Get conversation sessions from localStorage
 * @param {string} contextId - The context identifier
 * @param {string} mode - The learning mode ('chat' or 'quiz')
 * @returns {Array} - Array of conversation session objects
 */
const getSessionsFromLocalStorage = (contextId, mode) => {
  try {
    const key = `${mode}Sessions_${contextId}`;
    const storedSessions = localStorage.getItem(key);
    
    if (storedSessions) {
      return JSON.parse(storedSessions);
    }
    
    // Try to convert old format if no sessions found
    const oldKey = `${mode}History_${contextId}`;
    const oldHistory = localStorage.getItem(oldKey);
    
    if (oldHistory) {
      const history = JSON.parse(oldHistory);
      
      if (history.length > 0) {
        // Convert old format (individual messages) to session format
        const sessions = convertHistoryToSessions(history, mode);
        
        // Save in new format
        localStorage.setItem(key, JSON.stringify(sessions));
        
        return sessions;
      }
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching ${mode} sessions from localStorage:`, error);
    return [];
  }
};

/**
 * Convert old history format to new session format
 * @param {Array} history - Old format history array
 * @param {string} mode - The learning mode ('chat' or 'quiz')
 * @param {string} contextId - The context identifier
 * @returns {Array} - Array of session objects
 */
const convertHistoryToSessions = (history, mode, contextId) => {
  try {
    const sessions = [];
    let currentSession = null;
    
    // Group by timestamps that are close to each other (within 5 minutes)
    for (const item of history) {
      const itemTime = new Date(item.timestamp).getTime();
      
      if (!currentSession || 
          (itemTime - new Date(currentSession.lastUpdated).getTime() > 5 * 60 * 1000)) {
        // Start new session
        currentSession = {
          sessionId: generateSessionId(),
          courseName: item.courseName || contextId, // Use contextId if courseName missing
          mode: item.mode || mode,
          title: item.userMessage.substring(0, 30) + '...',
          messages: [
            { role: 'user', content: item.userMessage, timestamp: item.timestamp },
            addFeedbackData({ role: 'assistant', content: item.botResponse, timestamp: item.timestamp })
          ],
          timestamp: item.timestamp,
          lastUpdated: item.timestamp,
          userMessage: item.userMessage, // For backwards compatibility
          botResponse: item.botResponse  // For backwards compatibility
        };
        sessions.push(currentSession);
      } else {
        // Add to current session
        currentSession.messages.push(
          { role: 'user', content: item.userMessage, timestamp: item.timestamp },
          addFeedbackData({ role: 'assistant', content: item.botResponse, timestamp: item.timestamp })
        );
        currentSession.lastUpdated = item.timestamp;
      }
    }
    
    return sessions;
  } catch (error) {
    console.error('Error converting history to sessions:', error);
    return [];
  }
};

/**
 * Get the most recent chat sessions across all courses
 * @param {number} [maxItems=10] - Maximum number of items to return
 * @returns {Promise<Array>} - Array of recent conversation sessions from all courses
 */
export const getRecentChatSessions = async (maxItems = 10) => {
  try {
    // Check if user is authenticated
    if (!auth.currentUser) {
      console.warn("No user signed in, using localStorage fallback");
      return getRecentSessionsFromLocalStorage();
    }

    const userId = auth.currentUser.uid;
    
    // Get all courses first
    const coursesRef = collection(db, "users", userId, "courses");
    const coursesSnapshot = await getDocs(coursesRef);
    
    // Array to hold all recent sessions
    const recentSessions = [];
    
    // For each course, get recent chat and quiz sessions
    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id;
      const courseData = courseDoc.data();
      
      // Get chat sessions
      const chatRef = collection(db, "users", userId, "courses", courseId, "chatSessions");
      const chatQuery = query(
        chatRef,
        orderBy("lastUpdated", "desc"),
        limit(5) // Limit per course
      );
      
      const chatSnapshot = await getDocs(chatQuery);
      
      chatSnapshot.forEach((doc) => {
        const data = doc.data();
        const firstUserMessage = data.messages?.find(m => m.role === 'user')?.content || '';
        
        recentSessions.push({
          id: doc.id,
          sessionId: data.sessionId,
          courseId,
          courseName: courseData.courseName || data.courseName,
          timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
          lastUpdated: data.lastUpdated ? data.lastUpdated.toDate() : new Date(),
          title: data.title || firstUserMessage.substring(0, 30) + '...',
          userMessage: firstUserMessage, // For backwards compatibility
          botResponse: data.messages?.find(m => m.role === 'assistant')?.content || '',
          messages: data.messages || [],
          mode: 'chat'
        });
      });
      
      // Get quiz sessions
      const quizRef = collection(db, "users", userId, "courses", courseId, "quizSessions");
      const quizQuery = query(
        quizRef,
        orderBy("lastUpdated", "desc"),
        limit(5) // Limit per course
      );
      
      const quizSnapshot = await getDocs(quizQuery);
      
      quizSnapshot.forEach((doc) => {
        const data = doc.data();
        const firstUserMessage = data.messages?.find(m => m.role === 'user')?.content || '';
        
        recentSessions.push({
          id: doc.id,
          sessionId: data.sessionId,
          courseId,
          courseName: courseData.courseName || data.courseName,
          timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
          lastUpdated: data.lastUpdated ? data.lastUpdated.toDate() : new Date(),
          title: data.title || firstUserMessage.substring(0, 30) + '...',
          userMessage: firstUserMessage, // For backwards compatibility
          botResponse: data.messages?.find(m => m.role === 'assistant')?.content || '',
          messages: data.messages || [],
          mode: 'quiz'
        });
      });
    }
    
    // Sort by lastUpdated (newest first) and limit
    recentSessions.sort((a, b) => b.lastUpdated - a.lastUpdated);
    
    // Return limited number
    return recentSessions.slice(0, maxItems);
  } catch (error) {
    console.error(`Error fetching recent chat sessions:`, error);
    return getRecentSessionsFromLocalStorage();
  }
};

/**
 * Get recent sessions from localStorage
 * @returns {Array} - Array of recent sessions
 */
const getRecentSessionsFromLocalStorage = () => {
  try {
    // Find all session keys in localStorage
    const allSessions = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && (key.startsWith('chatSessions_') || key.startsWith('quizSessions_'))) {
        // Extract course name and mode from key
        const mode = key.startsWith('chatSessions_') ? 'chat' : 'quiz';
        const courseName = key.replace(`${mode}Sessions_`, '');
        
        // Get sessions
        const sessions = JSON.parse(localStorage.getItem(key) || '[]');
        
        // Add course and mode info if missing
        const enhancedSessions = sessions.map(session => ({
          ...session,
          courseName: session.courseName || courseName,
          mode: session.mode || mode
        }));
        
        allSessions.push(...enhancedSessions);
      }
    }
    
    // Sort by lastUpdated (newest first)
    allSessions.sort((a, b) => {
      return new Date(b.lastUpdated || b.timestamp) - new Date(a.lastUpdated || a.timestamp);
    });
    
    // Return limited number
    return allSessions.slice(0, 10);
  } catch (error) {
    console.error(`Error fetching recent chat sessions from localStorage:`, error);
    return [];
  }
};

/**
 * Get a specific conversation session
 * @param {string} contextId - The context identifier
 * @param {string} mode - The learning mode ('chat' or 'quiz')
 * @param {string} sessionId - The session ID to retrieve
 * @returns {Promise<Object|null>} - The conversation session or null if not found
 */
export const getConversationSession = async (contextId, mode, sessionId) => {
  try {
    // Check if user is authenticated
    if (!auth.currentUser) {
      console.warn("No user signed in, using localStorage fallback");
      return getSessionFromLocalStorage(contextId, mode, sessionId);
    }

    const userId = auth.currentUser.uid;
    const firestoreContextId = contextId.toLowerCase().replace(/ /g, '-');
    
    // Determine which collection to query based on mode
    const collectionName = mode === 'quiz' ? 'quizSessions' : 'chatSessions';
    
    // Query Firestore for the specific session
    const sessionsRef = collection(db, "users", userId, "courses", firestoreContextId, collectionName);
    const sessionQuery = query(sessionsRef, where("sessionId", "==", sessionId));
    const querySnapshot = await getDocs(sessionQuery);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        sessionId: data.sessionId,
        courseName: data.courseName,
        timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
        lastUpdated: data.lastUpdated ? data.lastUpdated.toDate().toISOString() : new Date().toISOString(),
        title: data.title || data.messages?.[0]?.content?.substring(0, 30) + '...',
        messages: data.messages || [],
        mode: data.mode || mode
      };
    }
    
    // If not found in Firestore, try localStorage
    return getSessionFromLocalStorage(contextId, mode, sessionId);
  } catch (error) {
    console.error(`Error fetching conversation session:`, error);
    return getSessionFromLocalStorage(contextId, mode, sessionId);
  }
};

/**
 * Get a specific session from localStorage
 * @param {string} contextId - The context identifier
 * @param {string} mode - The learning mode ('chat' or 'quiz')
 * @param {string} sessionId - The session ID to retrieve
 * @returns {Object|null} - The conversation session or null if not found
 */
const getSessionFromLocalStorage = (contextId, mode, sessionId) => {
  try {
    const key = `${mode}Sessions_${contextId}`;
    const storedSessions = localStorage.getItem(key);
    
    if (storedSessions) {
      const sessions = JSON.parse(storedSessions);
      return sessions.find(s => s.sessionId === sessionId) || null;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching session from localStorage:`, error);
    return null;
  }
};

/**
 * Delete all chat history for a context
 * @param {string} contextId - The context identifier
 * @param {string} [mode] - Optional mode to clear ('chat' or 'quiz'), if omitted clears both
 * @returns {Promise<boolean>} - Success status
 */
export const clearChatHistory = async (contextId, mode) => {
  try {
    // Clear from localStorage
    if (!mode || mode === 'chat') {
      localStorage.removeItem(`chatSessions_${contextId}`);
      localStorage.removeItem(`chatHistory_${contextId}`); // Old format
      localStorage.removeItem(`chat_session_${contextId}`); // Current session
    }
    
    if (!mode || mode === 'quiz') {
      localStorage.removeItem(`quizSessions_${contextId}`);
      localStorage.removeItem(`quizHistory_${contextId}`); // Old format
      localStorage.removeItem(`quiz_session_${contextId}`); // Current session
    }
    
    // If user is authenticated, clear from Firebase
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      const firestoreContextId = contextId.toLowerCase().replace(/ /g, '-');
      
      // Determine which collections to clear
      const collectionsToClear = [];
      if (!mode || mode === 'chat') {
        collectionsToClear.push('chatSessions');
        collectionsToClear.push('chatHistory'); // Old format
      }
      if (!mode || mode === 'quiz') {
        collectionsToClear.push('quizSessions');
        collectionsToClear.push('quizHistory'); // Old format
      }
      
      // Clear Firestore collections
      for (const collectionName of collectionsToClear) {
        const historyRef = collection(db, "users", userId, "courses", firestoreContextId, collectionName);
        const snapshot = await getDocs(historyRef);
        
        // This approach has limits - in a production app with many conversations,
        // we would use a batched delete or cloud function
        const deletePromises = [];
        snapshot.forEach(doc => {
          deletePromises.push(deleteDoc(doc.ref));
        });
        
        if (deletePromises.length > 0) {
          await Promise.all(deletePromises);
        }
      }
      
      // Update context document to reflect cleared history
      const contextRef = doc(db, "users", userId, "courses", firestoreContextId);
      await updateDoc(contextRef, {
        historyCleared: serverTimestamp()
      }, { merge: true });
    }
    
    return true;
  } catch (error) {
    console.error(`Error clearing chat history:`, error);
    return false;
  }
};

// Need to import this for the clearChatHistory function
import { deleteDoc } from 'firebase/firestore';

export default {
  saveChatHistory,
  getChatHistory,
  getAllChatHistory,
  getRecentChatSessions,
  clearChatHistory,
  getOrCreateSessionId,
  endCurrentSession,
  getConversationSession,
  forceNewSession,
  updateMessageFeedback
};