import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Enable CORS for all origins
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Setup file storage for uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize Google GenAI with API key
const API_KEY = process.env.GOOGLE_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PDF processing server is running' });
});

// PDF processing endpoint
app.post('/api/process-pdf', upload.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Get the prompt from the request or use a default
    const prompt = req.body.prompt || 'Analyze this PDF and explain what it contains.';
    
    // Convert file buffer to base64
    const base64Data = req.file.buffer.toString('base64');
    
    // Create contents array similar to gemini-doc.js
    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Data
        }
      }
    ];
    
    // Process with Google GenAI
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: contents
    });
    
    // Return the response text
    res.json({
      text: response.text,
      success: true
    });
    
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ 
      error: 'Error processing PDF', 
      message: error.message,
      success: false
    });
  }
});

// Set port and start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`PDF processing server running on port ${PORT}`);
});