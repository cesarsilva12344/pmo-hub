import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.log("No API Key found in process.env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        // There isn't a direct listModels method on the client instance in some versions, 
        // but usually we test by trying to generate content or looking at documentation.
        // However, for the purpose of this environment, let's try a simple generation with a known fallback.
        // Actually, recent SDKs don't expose listModels directly on the client object easily in Node without using the model manager? 
        // Let's just try to hit 'gemini-1.5-flash' and 'gemini-1.0-pro' and see which one doesn't throw 404.

        const modelsToTest = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro", "gemini-pro"];

        console.log("Testing models...");

        for (const modelName of modelsToTest) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                const response = await result.response;
                console.log(`SUCCESS: ${modelName} works.`);
                break; // Stop after first success
            } catch (error) {
                console.log(`FAILED: ${modelName} - ${error.message}`);
            }
        }
    } catch (error) {
        console.error("Global Error:", error);
    }
}

listModels();
