import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parser with larger limit for vision base64 images
app.use(express.json({ limit: "20mb" }));

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } else {
    console.warn("GEMINI_API_KEY is not defined. AI features will operate in sandbox/mock mode.");
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI:", error);
}

// 1. Chat & Action Planning Endpoint
app.post("/api/auroza/chat", async (req, res) => {
  const { message, history, permissions, memory, assistantName, language, voice } = req.body;

  if (!ai) {
    // Elegant fallback if API key is not available
    return res.json({
      message: `[Sandbox Mode] I heard: "${message}". Please set up your GEMINI_API_KEY in Settings > Secrets to enable live responses!`,
      actions: [{ type: "search_web", payload: { query: message } }],
      updateMemory: "User is exploring Auroza AI in sandbox mode."
    });
  }

  try {
    // Construct rich system instructions
    const systemInstruction = `
You are ${assistantName || "Auroza AI"}, a highly intelligent, premium Android personal AI Assistant.
You can communicate naturally in multiple languages, including English, Urdu, Hindi, Sindhi, Arabic, and others. Always match the user's language unless requested otherwise.

The user's current preferences:
- Selected Assistant Name: ${assistantName || "Auroza AI"}
- Core Language: ${language || "English"}
- Selected Voice: ${voice || "Zephyr"}

Current Device State & Permissions:
- Camera Access: ${permissions?.camera ? "GRANTED" : "DENIED"}
- Microphone Access: ${permissions?.microphone ? "GRANTED" : "DENIED"}
- Contacts: ${permissions?.contacts ? "GRANTED" : "DENIED"}
- Phone (Make Calls): ${permissions?.phone ? "GRANTED" : "DENIED"}
- SMS (Send Messages): ${permissions?.sms ? "GRANTED" : "DENIED"}
- Location: ${permissions?.location ? "GRANTED" : "DENIED"}

Auroza's Current Memory Logs (use this to personalize, refer to, or build rapport with the user):
${memory || "No memory logs saved yet."}

AUTOMATION CAPABILITIES:
You can orchestrate operations on the virtual phone. If the user asks you to do something, determine if you can plan action steps.
The allowed action types are:
- "open_app": Open standard social/util apps (WhatsApp, Facebook, Instagram, TikTok, X, Settings, Contacts, Messages).
- "make_call": Initiate a call. Requires "phone" and "contacts" permissions. If contacts is denied, you can still call a number if provided.
- "send_sms": Send message. Requires "sms" permission.
- "create_reminder": Set alarms/reminders/notes.
- "search_web": Search Google.
- "play_youtube": Search and play video on YouTube.
- "search_ecommerce": Search Amazon or Daraz for products.
- "open_camera": Trigger phone camera. Requires "camera" permission.
- "open_gallery": Open photos.

POLICY & SAFETY:
1. If the user requests an action (like making a call, sending a message, or opening camera) but the required permission is DENIED, politely inform them of the denied permission, and provide instructions to grant it. Do NOT output the actions in the JSON actions list.
2. If the user requests a sensitive action (making calls, sending messages, opening camera), formulate the action but in your text 'message' mention that you will open it with their permission/confirmation.

Your response MUST be a JSON object matching this schema:
{
  "message": "Your conversational spoken/text response in the user's language.",
  "actions": [
    {
      "type": "open_app" | "make_call" | "send_sms" | "create_reminder" | "search_web" | "play_youtube" | "search_ecommerce" | "open_camera" | "open_gallery",
      "payload": {
        "appName": string (required for open_app: e.g. 'WhatsApp', 'Facebook', 'Instagram', 'TikTok', 'X', 'Settings'),
        "phoneNumber": string (optional, for make_call/send_sms),
        "contactName": string (optional, for make_call/send_sms),
        "message": string (optional, for send_sms),
        "title": string (optional, for create_reminder),
        "query": string (optional, for search_web/play_youtube),
        "platform": "Amazon" | "Daraz" (optional, for search_ecommerce),
        "item": string (optional, for search_ecommerce)
      }
    }
  ],
  "updateMemory": "If you learned something new, personal, or permanent about the user (e.g. their name, interests, family details), output a short 1-sentence note here so it is saved to memory. Otherwise, leave empty."
}
`;

    // Package the history for Gemini
    const formattedContents = history.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    // Add current user prompt
    formattedContents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["message", "actions"],
          properties: {
            message: {
              type: Type.STRING,
              description: "The text to speak or show to the user"
            },
            actions: {
              type: Type.ARRAY,
              description: "Sequence of automated phone actions",
              items: {
                type: Type.OBJECT,
                required: ["type"],
                properties: {
                  type: {
                    type: Type.STRING,
                    description: "Action type"
                  },
                  payload: {
                    type: Type.OBJECT,
                    properties: {
                      appName: { type: Type.STRING },
                      phoneNumber: { type: Type.STRING },
                      contactName: { type: Type.STRING },
                      message: { type: Type.STRING },
                      title: { type: Type.STRING },
                      query: { type: Type.STRING },
                      platform: { type: Type.STRING },
                      item: { type: Type.STRING }
                    }
                  }
                }
              }
            },
            updateMemory: {
              type: Type.STRING,
              description: "Short user memory update to persist, or empty string"
            }
          }
        }
      }
    });

    const jsonText = response.text || "{}";
    const parsedData = JSON.parse(jsonText.trim());
    return res.json(parsedData);

  } catch (error: any) {
    console.error("Gemini Chat API Error:", error);
    return res.status(500).json({
      error: "Failed to communicate with Auroza engine",
      message: "I encountered a processing glitch in my cloud services. Let me recover and try again!",
      actions: []
    });
  }
});

// 2. Vision API Endpoint
app.post("/api/auroza/vision", async (req, res) => {
  const { imageBase64, prompt, assistantName, language } = req.body;

  if (!ai) {
    return res.json({
      message: "[Sandbox Vision] I see a camera capture. Please connect your GEMINI_API_KEY in secrets to get live intelligence analysis!",
      actions: []
    });
  }

  try {
    const cleanedBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: cleanedBase64,
      },
    };

    const textPrompt = `
You are ${assistantName || "Auroza AI"}, responding as a vision assistant inside an Android phone.
The user has opened their camera and captured this live image.
The user's query or prompt is: "${prompt || "Analyze this image and tell me what you see."}"
Respond directly and warmly in the user's selected language (${language || "English"}), commenting on the image's content. Keep the response compact and conversational.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [imagePart, { text: textPrompt }]
      },
      config: {
        systemInstruction: `You are ${assistantName || "Auroza AI"}, analyzing a real-time camera snapshot.`
      }
    });

    return res.json({
      message: response.text || "I see the camera feed clearly!",
      actions: []
    });

  } catch (error) {
    console.error("Gemini Vision API Error:", error);
    return res.status(500).json({
      error: "Failed to process visual content",
      message: "I couldn't analyze the snapshot due to a camera transfer error."
    });
  }
});

// Mount Vite middleware or static files
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Auroza AI full-stack server running on http://localhost:${PORT}`);
  });
}

initServer().catch((err) => {
  console.error("Failed to boot server:", err);
});
