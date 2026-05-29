const Reminder = require('../models/Reminder.model');
const { GoogleGenAI } = require('@google/genai');


// Initialize Gemini SDK (Make sure GEMINI_API_KEY is in your .env)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 1. Handle Manual Submission
const createManualReminder = async (req, res) => {
  try {
    const { caseTitle, description, hearingDate } = req.body;
    
    // Simple validation
    if (!caseTitle || !description || !hearingDate) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const newReminder = new Reminder({
      userId: req.user?.id || "60d000000000000000000001", // Replace with authenticated user ID
      caseTitle,
      description,
      hearingDate: new Date(hearingDate)
    });

    await newReminder.save();
    res.status(201).json({ message: "Reminder set successfully!", data: newReminder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Handle Document Upload & Auto-Extraction
const createAiReminder = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a document." });
    }

    // Convert uploaded file buffer to base64 for Gemini
    const fileBase64 = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    const prompt = `Analyze this legal document. Extract three fields:
    1. A short, recognizable title for the case (caseTitle).
    2. A concise summary description of what the notice/hearing is about (description).
    3. The absolute next court hearing date formatted strictly as YYYY-MM-DD (hearingDate).
    
    Return the response strictly as a JSON object matching this structure:
    {
      "caseTitle": "string",
      "description": "string",
      "hearingDate": "YYYY-MM-DD"
    }`;

    // Query Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: fileBase64,
            mimeType: mimeType
          }
        },
        prompt
      ],
      config: {
        responseMimeType: "application/json" // Enforces a parseable JSON response
      }
    });

    // Parse the extracted text
    const extractedData = JSON.parse(response.text);

    // Save extracted details to MongoDB
    const newReminder = new Reminder({
      userId: req.user?.id || "60d000000000000000000001", 
      caseTitle: extractedData.caseTitle,
      description: extractedData.description,
      hearingDate: new Date(extractedData.hearingDate)
    });

    await newReminder.save();
    res.status(201).json({ message: "Document processed and reminder saved!", data: newReminder });

  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ error: "Failed to process document. Please input manually if problem persists." });
  }
};

module.exports = { createManualReminder, createAiReminder };