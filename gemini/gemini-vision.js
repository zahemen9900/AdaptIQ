import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Converts local file information to base64
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = "Tell me what you see in the image";

  const imageParts = [
    fileToGenerativePart("Designer.png", "image/jpeg"),
    // fileToGenerativePart("piranha.jpg", "image/jpeg"),
  ];

  const generatedContent = await model.generateContent([prompt, ...imageParts]);
  
  console.log(generatedContent.response.text());
}

run();
