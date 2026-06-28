# Auroza AI - Premium Android Studio & FastAPI Backend Export Guide

Welcome to the production code module of **Auroza AI**. This folder contains the complete, production-ready code blocks to connect your physical Android device or emulator with our advanced AI orchestrator.

## 📁 Repository Structure

```
├── /backend/                  <- FastAPI Backend Server
│   ├── main.py                <- Core routing, memory engine, and Gemini API integration
│   └── requirements.txt       <- Python dependencies
│
└── /android/                  <- Native Android Studio project structure
    └── app/src/main/
        ├── java/com/auroza/ai/
        │   ├── MainActivity.kt               <- Voice recognition & backend orchestrator
        │   └── AurozaAccessibilityService.kt  <- Handles automated screen taps and inputs
        └── res/layout/
            └── activity_main.xml             <- High-fidelity dark mode Android interface
```

---

## ⚡ Step 1: Launching the FastAPI Backend

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install the dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure your Gemini API Key**:
   ```bash
   export GEMINI_API_KEY="your_api_key_here"
   ```

4. **Boot the server**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```
   *Your server will now be live on `http://localhost:8000`*.

---

## 📱 Step 2: Running the Android App in Android Studio

1. **Open Android Studio** and select **Open An Existing Project**.
2. Point it to the `/android` directory.
3. Configure your backend server's URL inside `MainActivity.kt`:
   ```kotlin
   private val BACKEND_URL = "http://YOUR_SERVER_IP:8000/api/auroza/chat"
   ```
4. **Build and Run** the application on a real device or a virtual emulator.
5. Grant the **Accessibility Service** permission under:
   `Settings > Accessibility > Installed Services > Auroza AI`

---

## 🎙️ Supported Languages
The voice processor automatically flags and understands speech in:
- **English**
- **Urdu (اردو)**
- **Hindi (हिंदी)**
- **Sindhi (سنڌي)**
- **Arabic (العربية)**
- and many other regional languages!
