// This is a basic example of using the Google Generative AI API with streaming capabilities.
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load environment variables from .env file
dotenv.config();

// Access the API key properly
const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.error("Error: GOOGLE_API_KEY is not defined in .env file");
  process.exit(1);
}

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(apiKey);

async function main() {
  try {
    // Get the gemini-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Generate content with streaming
    const prompt = "Explain how AI works in detail";
    console.log(`Prompt: ${prompt}\n`);
    console.log("Response (streaming):");
    
    // Use streaming API
    const streamingResult = await model.generateContentStream(prompt);
    
    // Process the streaming response
    for await (const chunk of streamingResult.stream) {
      const chunkText = chunk.text();
      process.stdout.write(chunkText);
    }
    
    console.log("\n\nStreaming complete!");
  } catch (error) {
    console.error("Error generating content:", error);
  }
}

// Run the main function
main();
