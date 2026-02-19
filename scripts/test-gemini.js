const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

async function listModels() {
    try {
        // Read .env.local
        const envPath = path.join(__dirname, '../.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/NEXT_PUBLIC_GEMINI_API_KEY=(.*)/);

        if (!match) {
            console.error("Could not find NEXT_PUBLIC_GEMINI_API_KEY in .env.local");
            return;
        }

        const key = match[1].trim();
        console.log("Using API Key ending in:", key.slice(-4));

        console.log("Fetching available models...");

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", JSON.stringify(data.error, null, 2));
        } else if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log("No models found or unexpected format:", data);
        }

    } catch (error) {
        console.error("Script Error:", error);
    }
}

listModels();
