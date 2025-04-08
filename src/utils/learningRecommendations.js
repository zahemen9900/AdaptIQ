// AI-powered learning recommendation utility for AdaptIQ
import { GoogleGenerativeAI } from "@google/generative-ai";

// Google Gemini API endpoint configuration
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "your-api-key"; // Make sure to set this in .env file
const MODEL_NAME = "gemini-1.5-flash"; // Using Gemini 2.0 Flash for quick responses

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Generate AI-powered learning recommendations based on user data
 * @param {Object} userData - The user's learning data and preferences
 * @returns {Promise<Object>} - The recommendation response
 */
export const generateLearningRecommendations = async (userData) => {
  try {
    // Check if API key is properly configured
    if (!API_KEY || API_KEY === "your-api-key") {
      console.error("Gemini API key not configured");
      return {
        success: false,
        error: "API key not configured",
        recommendationText: "Could not generate recommendations. Please check API configuration."
      };
    }
    
    // Initialize model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    // Format user data for the prompt
    const nickname = userData.nickname || "Student";
    const userSubjects = userData.subjects || [];
    const userCourses = userData.courses || [];
    const learningStyle = userData.learningStyle || "visual";
    const schedulingStyle = userData.schedulingStyle || "balanced";
    const studyDuration = userData.studyDuration || "60";
    const gradeLevel = userData.gradeLevel || "college";
    const studyEnvironment = userData.studyEnvironment || "quiet";
    const studyStreak = userData.studyStreak || 0;
    const schedule = userData.schedule || {};
    
    // Build the recommendation prompt
    const prompt = `
    As an AI educational consultant for the AdaptIQ learning platform, I need to provide personalized learning recommendations
    to a student with the following profile:

    - Nickname: ${nickname}
    - Learning Style: ${learningStyle}
    - Scheduling Preference: ${schedulingStyle}
    - Study Duration: ${studyDuration} minutes per session
    - Grade Level: ${gradeLevel}
    - Preferred Study Environment: ${studyEnvironment}
    - Current Study Streak: ${studyStreak} days
    - Subjects: ${userSubjects.join(', ')}
    - Courses: ${userCourses.map(course => {
      // Clean up course IDs to be more readable
      return course.replace(/^([^-]+)-(.+)$/, (_, subject, course) => {
        return `${course.charAt(0).toUpperCase() + course.slice(1)} (${subject})`;
      });
    }).join(', ')}
    - Schedule: ${Object.keys(schedule).join(', ')}

    Based on this student's profile, provide a comprehensive learning recommendation in 3-5 paragraphs that includes:
    1. Personalized study strategies that match their learning style
    2. Specific tips for maintaining their study schedule and improving their streak
    3. Recommendations for optimizing their study environment
    4. Suggestions for time management based on their scheduling preference
    5. Course-specific advice for 1-2 of their subjects

    Focus on being encouraging, specific, and actionable. Keep the recommendations under 500 words.
    `;
    
    // Generate streaming content with Gemini
    const streamingResult = await model.generateContentStream(prompt);
    
    // Initialize recommendation text
    let recommendationText = "";
    
    // Process the streaming response
    for await (const chunk of streamingResult.stream) {
      const chunkText = chunk.text();
      recommendationText += chunkText;
    }
    
    // Return the complete recommendation
    return {
      success: true,
      recommendationText,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error generating learning recommendations:", error);
    return {
      success: false,
      error: error.message || "Failed to generate recommendations",
      recommendationText: "Sorry, we couldn't generate personalized recommendations at this time. Please try again later."
    };
  }
};

/**
 * Generate quick learning tips based on a specific focus area
 * @param {string} focusArea - The area to focus recommendations on (e.g. "time-management", "motivation")
 * @param {Object} userData - Basic user preference data
 * @returns {Promise<Object>} - The tip response
 */
export const generateQuickLearningTip = async (focusArea, userData = {}) => {
  try {
    // Check for API key
    if (!API_KEY || API_KEY === "your-api-key") {
      console.error("Gemini API key not configured");
      return {
        success: false,
        error: "API key not configured",
        tipText: "Could not generate tip. Please check API configuration."
      };
    }
    
    // Initialize model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    // Get basic user preferences
    const learningStyle = userData.learningStyle || "visual";
    const schedulingStyle = userData.schedulingStyle || "balanced";
    
    // Build the tip prompt
    const prompt = `
    As an AI educational coach for the AdaptIQ learning platform, provide a single concise and effective 
    learning tip related to "${focusArea}" for a student with a ${learningStyle} learning style who prefers 
    ${schedulingStyle} scheduling. Make the tip specific, actionable, and about 2-3 sentences long.
    `;
    
    // Generate content
    const result = await model.generateContent(prompt);
    const tipText = result.response.text();
    
    return {
      success: true,
      tipText,
      focusArea,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error generating learning tip:", error);
    return {
      success: false,
      error: error.message || "Failed to generate tip",
      tipText: "Tip unavailable at this time."
    };
  }
};

export default {
  generateLearningRecommendations,
  generateQuickLearningTip
};