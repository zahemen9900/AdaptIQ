import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

async function main() {
    const contents = [
        { text: "Explain what this document is about." },
        {
            inlineData: {
                mimeType: 'application/pdf',
                data: Buffer.from(fs.readFileSync("AdaptIQ Documentation.pdf")).toString("base64")
            }
        }
    ];

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: contents
    });
    console.log(response.text);
}

main();