// Utility functions for interacting with the Google Gemini API
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API with the key from environment variables
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Generate a chat response using the Gemini API with streaming
 * @param {string} prompt - The user's question or prompt
 * @param {string} systemPrompt - Instructions for the AI on how to respond
 * @param {Function} onStreamChunk - Callback function to handle each chunk of the streamed response
 * @returns {Promise<string>} - The complete response text after streaming is done
 */
export const generateStreamingResponse = async (prompt, systemPrompt, onStreamChunk) => {
  try {
    // Check if API key is available
    if (!apiKey) {
      console.error("Error: VITE_GOOGLE_API_KEY is not defined in environment variables");
      return "Sorry, I can't connect to the AI service right now. Please check your API key configuration.";
    }

    // Get the gemini-pro model - using the correct model name
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    console.log("Sending request to Gemini API with prompt:", prompt);
    
    // Generate content with streaming - simplified approach
    try {
      // Create a simple text prompt combining system prompt and user query
      const fullPrompt = `${systemPrompt}\n\nQuestion: ${prompt}`;
      console.log("Full prompt:", fullPrompt);
      
      const streamingResult = await model.generateContentStream(fullPrompt);
      
      // Collect the full response
      let fullResponse = "";
      
      // Process the streaming response
      for await (const chunk of streamingResult.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        
        // Call the callback function with each chunk
        if (onStreamChunk) {
          onStreamChunk(chunkText);
        }
      }
      
      return fullResponse;
    } catch (apiError) {
      console.error("Gemini API Error:", apiError);
      
      // Check for specific error types
      if (apiError.message?.includes("API key")) {
        return "There seems to be an issue with the API key. Please check your configuration.";
      } else if (apiError.message?.includes("quota")) {
        return "The API quota has been exceeded. Please try again later.";
      } else {
        return `Sorry, there was an error generating a response: ${apiError.message}`;
      }
    }
  } catch (error) {
    console.error("Error details:", error);
    return "Sorry, there was an unexpected error. Please try again later.";
  }
};

/**
 * Generate a response for evaluating quiz answers using Gemini API
 * @param {string} question - The quiz question
 * @param {string} userAnswer - The user's answer
 * @param {string} subject - The subject being studied
 * @returns {Promise<string>} - The evaluation response
 */
export const evaluateQuizAnswerWithGemini = async (question, userAnswer, subject) => {
  try {
    if (!apiKey) {
      console.error("Error: VITE_GOOGLE_API_KEY is not defined in environment variables");
      return "Sorry, I can't connect to the AI service right now. Please check your API key configuration.";
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `
      You are an expert ${subject} teacher evaluating a student's answer to the following question:
      
      Question: ${question}
      
      Student's Answer: ${userAnswer}
      
      Provide constructive feedback on the answer. Explain what was correct, what could be improved, 
      and the correct approach if the answer was incorrect. Be encouraging and educational.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error evaluating quiz answer:", error);
    return `Sorry, there was an error evaluating your answer: ${error.message}`;
  }
};

/**
 * Check if the Gemini API is available and configured
 * @returns {Promise<boolean>} - True if the API is configured and working
 */
export const checkGeminiApiAvailability = async () => {
  try {
    if (!apiKey) {
      console.error("Error: VITE_GOOGLE_API_KEY is not defined in environment variables");
      return false;
    }
    
    // Simple test call to check if API is working
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Send a simple request to test the API
    try {
      const result = await model.generateContent("Test connection");
      console.log("Gemini API connection successful");
      return true;
    } catch (apiError) {
      console.error("Gemini API connection error:", apiError);
      return false;
    }
  } catch (error) {
    console.error("Gemini API check failed:", error);
    return false;
  }
};