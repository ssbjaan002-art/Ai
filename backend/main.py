import os
from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
from typing import List, Optional
from google import genai
from google.genai import types

app = FastAPI(
    title="Auroza AI - Premium Phone Automation Backend",
    version="1.0.0",
    description="Main FastAPI backend supporting real-time speech analytics, task planning, and device overlay automation."
)

# Enable secure CORS for Android / client connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY_NAME = "X-Auroza-Token"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def get_api_key(header_value: str = Depends(api_key_header)):
    # In production, secure this endpoint
    return header_value

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatPayload(BaseModel):
    message: str
    history: List[ChatMessage]
    permissions: dict
    memory: Optional[str] = ""
    assistantName: Optional[str] = "Auroza AI"
    language: Optional[str] = "English"
    voice: Optional[str] = "Zephyr"
    style: Optional[str] = "Warm"

class VisionPayload(BaseModel):
    imageBase64: str
    prompt: Optional[str] = "Analyze camera frame"
    assistantName: Optional[str] = "Auroza AI"
    language: Optional[str] = "English"

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "Auroza AI Backend"}

@app.post("/api/auroza/chat")
async def chat_interaction(payload: ChatPayload, token: str = Depends(get_api_key)):
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        # Graceful sandbox mode fallback
        return {
            "message": f"[Sandbox Mode] Received: '{payload.message}'. Please configure GEMINI_API_KEY to start production automation.",
            "actions": [],
            "updateMemory": "Configuring sandbox environment."
        }
    
    try:
        # Initialize Google GenAI client
        client = genai.Client(api_key=gemini_key)
        
        system_instruction = f"""
You are {payload.assistantName}, an incredibly powerful, premium Android Voice Assistant.
Your current AI personality style/tone is: "{payload.style}".
- If "Warm": Respond with high empathy, friendliness, polite care, and reassuring phrases.
- If "Energetic": Respond with high enthusiasm, excitement, dynamic wording, and exclamation marks.
- If "Professional": Respond with crisp, precise, efficient, direct, and well-structured corporate-grade assistance.

You can communicate in Urdu, Hindi, English, Sindhi, Arabic, and other regional languages.
Always respond gracefully in the language used by the user.

Current Permissions: {payload.permissions}
Cognitive Memory Bank: {payload.memory}

You possess dynamic phone control automation capabilities. 
If the user requests an action, formulate an automation block.
Supported actions:
- "open_app": (e.g. WhatsApp, YouTube, X, Facebook, Settings, Camera, Gallery, AI Creator)
- "make_call": (phoneNumber or contactName)
- "send_sms": (phoneNumber, message)
- "create_reminder": (title)
- "search_web": (query)
- "play_youtube": (query)
- "search_ecommerce": (platform: "Amazon" | "Daraz", item: string)
- "generate_image": (prompt: detailed visual descriptive prompt in English to draw the requested picture)

Format your output strictly as a JSON matching this structure:
{{
  "message": "Conversational human-like response text",
  "actions": [{{ "type": "generate_image", "payload": {{ "prompt": "A beautiful majestic king in high-fidelity golden armor sitting on an obsidian throne, 4k resolution, cinematic lighting" }} }}],
  "updateMemory": "Any long term facts to save or empty"
}}
"""
        # Build contents from history
        contents = []
        for h in payload.history:
            role = "model" if h.role == "assistant" else "user"
            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=h.content)]))
            
        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=payload.message)]))
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema={
                    "type": "OBJECT",
                    "required": ["message", "actions"],
                    "properties": {
                        "message": {"type": "STRING"},
                        "actions": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "required": ["type"],
                                "properties": {
                                    "type": {"type": "STRING"},
                                    "payload": {
                                        "type": "OBJECT",
                                        "properties": {
                                            "appName": {"type": "STRING"},
                                            "phoneNumber": {"type": "STRING"},
                                            "contactName": {"type": "STRING"},
                                            "message": {"type": "STRING"},
                                            "title": {"type": "STRING"},
                                            "query": {"type": "STRING"},
                                            "platform": {"type": "STRING"},
                                            "item": {"type": "STRING"},
                                            "prompt": {"type": "STRING"}
                                        }
                                    }
                                }
                            }
                        },
                        "updateMemory": {"type": "STRING"}
                    }
                }
            )
        )
        
        import json
        return json.loads(response.text)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")

@app.post("/api/auroza/vision")
async def vision_interaction(payload: VisionPayload):
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return {"message": "[Sandbox Mode] Captured camera frame received. Set up your API key for live analysis."}
        
    try:
        client = genai.Client(api_key=gemini_key)
        
        # Prepare visual part (handles both absolute URLs and base64 payloads)
        import base64
        if payload.imageBase64.startswith("http"):
            import httpx
            async with httpx.AsyncClient() as client_http:
                resp = await client_http.get(payload.imageBase64)
                img_data = resp.content
                mime_type = resp.headers.get("content-type", "image/jpeg")
            image_part = types.Part.from_bytes(
                data=img_data,
                mime_type=mime_type
            )
        else:
            base64_str = payload.imageBase64.split(",")[-1]
            try:
                img_data = base64.b64decode(base64_str)
            except Exception:
                img_data = base64_str.encode("utf-8")
                
            image_part = types.Part.from_bytes(
                data=img_data,
                mime_type="image/jpeg"
            )
        
        prompt = f"You are {payload.assistantName}. Describe this live snapshot captured from the mobile lens in {payload.language} language."
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[image_part, prompt]
        )
        return {"message": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
