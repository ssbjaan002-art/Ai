import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Mic, 
  MicOff,
  Paperclip, 
  Phone, 
  MessageSquare, 
  Youtube, 
  Compass, 
  Search, 
  Plus, 
  Settings as SettingsIcon,
  Play, 
  AlertCircle,
  Home,
  Clock,
  Battery,
  Wifi,
  Smartphone,
  Check,
  User,
  X,
  Maximize2,
  Minimize2,
  Camera,
  Image as ImageIcon,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { 
  Message, 
  DeviceAction, 
  PermissionsState, 
  AssistantConfig, 
  ActivePhoneApp, 
  AutomationStep 
} from "../types";

interface VirtualPhoneProps {
  permissions: PermissionsState;
  config: AssistantConfig;
  memory: string[];
  setMemory: React.Dispatch<React.SetStateAction<string[]>>;
  isSandbox: boolean;
  addAutomationLog: (desc: string, status: "pending" | "running" | "completed" | "failed") => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  simulateCommand: string;
  clearSimulateCommand: () => void;
  galleryImages: string[];
  setGalleryImages: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function VirtualPhone({
  permissions,
  config,
  memory,
  setMemory,
  isSandbox,
  addAutomationLog,
  messages,
  setMessages,
  simulateCommand,
  clearSimulateCommand,
  galleryImages,
  setGalleryImages
}: VirtualPhoneProps) {
  // Navigation & Screens
  const [activeScreen, setActiveScreen] = useState<ActivePhoneApp>("home");
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // Floating Bubble State
  const [isFloatingActive, setIsFloatingActive] = useState(false);
  const [bubblePos, setBubblePos] = useState({ x: 20, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Web Speech API States
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const [speechFeedback, setSpeechFeedback] = useState("");

  // Simulated Databases & States
  const [reminders, setReminders] = useState<{ id: string; title: string; done: boolean }[]>([
    { id: "1", title: "Review tomorrow's plan with Auroza", done: false },
    { id: "2", title: "Pick up fresh groceries", done: true }
  ]);
  const [phoneDialNum, setPhoneDialNum] = useState("");
  const [activeCallContact, setActiveCallContact] = useState<string | null>(null);
  const [smsContact, setSmsContact] = useState("");
  const [smsText, setSmsText] = useState("");
  const [youtubeQuery, setYoutubeQuery] = useState("");
  const [webQuery, setWebQuery] = useState("");
  const [ecommerceQuery, setEcommerceQuery] = useState("");
  const [ecommercePlatform, setEcommercePlatform] = useState<"Amazon" | "Daraz">("Amazon");
  // Audio Waveform animation state helper
  const [micPulse, setMicPulse] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Auto Scroll Chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Handle Outside simulated triggers
  useEffect(() => {
    if (simulateCommand) {
      if (simulateCommand === "open_gallery") {
        setActiveScreen("gallery");
        addAutomationLog("Transferred artwork from PC Studio. Opened phone gallery.", "completed");
        clearSimulateCommand();
      } else {
        handleUserSubmit(simulateCommand);
        clearSimulateCommand();
      }
    }
  }, [simulateCommand]);

  // Clean camera video track on screen shift
  useEffect(() => {
    if (activeScreen !== "camera") {
      stopCamera();
    } else {
      startCamera();
    }
  }, [activeScreen]);

  // Initialize Web Speech Recognition with dynamic text updates
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechFeedback("Speech recognition not supported on this browser.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = getLanguageLocale(config.language);

    rec.onstart = () => {
      setMicPulse(true);
      setSpeechFeedback("سن رہے ہیں... بولنا شروع کریں");
    };

    rec.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const textResult = final || interim;
      if (textResult) {
        setInputText(textResult);
        setVoiceTranscript(textResult);
        setSpeechFeedback(`بولا گیا ٹیکسٹ: "${textResult}"`);
      } else {
        setSpeechFeedback("سن رہے ہیں... بولنا شروع کریں");
      }
    };

    rec.onerror = (e: any) => {
      console.error("Speech Recognition Error:", e);
      if (e.error === "not-allowed") {
        setSpeechFeedback("مائیکروفون کی اجازت نہیں ملی۔");
      } else {
        setSpeechFeedback("آواز کو ٹیکسٹ میں تبدیل کرنے میں کچھ مسئلہ ہوا۔");
      }
      setIsListening(false);
      setMicPulse(false);
    };

    rec.onend = () => {
      if (isListening) {
        try {
          rec.start();
        } catch (err) {
          console.debug("Speech restart ignored", err);
        }
      } else {
        setMicPulse(false);
      }
    };

    recognitionRef.current = rec;

    if (isListening) {
      try {
        rec.start();
      } catch (err) {
        console.debug("Speech start ignored", err);
      }
    } else {
      try {
        rec.stop();
      } catch (err) {
        console.debug("Speech stop ignored", err);
      }
    }

    return () => {
      try {
        rec.abort();
      } catch (err) {
        console.debug("Speech abort failed", err);
      }
    };
  }, [config.language, isListening]);

  // Helper to resolve locale string
  const getLanguageLocale = (lang: string) => {
    switch (lang) {
      case "Urdu": return "ur-PK";
      case "Hindi": return "hi-IN";
      case "Sindhi": return "sd-PK";
      case "Arabic": return "ar-AE";
      case "Spanish": return "es-ES";
      default: return "en-US";
    }
  };

  // Speaks out response text dynamically
  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // cancel current speech
    
    // Clean code formatting tags or sandbox warnings
    const cleaned = text.replace(/\[Sandbox Mode\]/g, "").replace(/\*+/g, "");
    const utterance = new SpeechSynthesisUtterance(cleaned);
    
    // Choose voice based on user preference
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => v.lang.startsWith(getLanguageLocale(config.language).substring(0, 2)));
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Natural"));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Speed and voice-changing pitch adjustments
    let customPitch = 1.0;
    let customRate = 1.0;

    if (config.voice === "Fenrir") {
      customPitch = 0.8;
    } else if (config.voice === "Kore") {
      customPitch = 1.2;
    } else if (config.voice === "Puck") {
      customPitch = 1.4;
      customRate = 1.1;
    } else if (config.voice === "Charon") {
      customPitch = 0.9;
      customRate = 0.95;
    } else if (config.voice === "Child") {
      customPitch = 1.75;
      customRate = 1.15;
    } else if (config.voice === "Girl") {
      customPitch = 1.35;
      customRate = 1.0;
    } else if (config.voice === "YoungBoy") {
      customPitch = 1.5;
      customRate = 1.05;
    } else if (config.voice === "OldMan") {
      customPitch = 0.55;
      customRate = 0.82;
    }

    // Apply voice-changing style/tone modifier
    if (config.style === "Warm") {
      customPitch *= 0.92;
      customRate *= 0.90;
    } else if (config.style === "Energetic") {
      customPitch *= 1.15;
      customRate *= 1.20;
    } else if (config.style === "Professional") {
      customPitch *= 1.02;
      customRate *= 1.02;
    }

    utterance.pitch = Math.min(2.0, Math.max(0.5, customPitch));
    utterance.rate = Math.min(2.0, Math.max(0.5, customRate));
    
    window.speechSynthesis.speak(utterance);
  };

  // Floating Bubble dragging mechanics
  const startDrag = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - bubblePos.x,
      y: e.clientY - bubblePos.y
    };
  };

  const onDrag = (e: MouseEvent) => {
    if (!isDragging) return;
    setBubblePos({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const endDrag = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", onDrag);
      window.addEventListener("mouseup", endDrag);
    } else {
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", endDrag);
    }
    return () => {
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", endDrag);
    };
  }, [isDragging]);

  // Main input trigger processor
  const handleUserSubmit = async (text: string) => {
    if (!text.trim()) return;
    
    // 1. Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    addAutomationLog(`Incoming request: "${text}"`, "pending");

    try {
      const response = await fetch("/api/auroza/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10), // Pass the last 10 messages for rich context
          permissions,
          memory: memory.join("\n"),
          assistantName: config.name,
          language: config.language,
          voice: config.voice,
          style: config.style
        })
      });

      const data = await response.json();
      setIsTyping(false);

      if (data.message) {
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions: data.actions
        };

        setMessages(prev => [...prev, assistantMsg]);
        speakText(data.message);

        // Process cognitive memory updates
        if (data.updateMemory && data.updateMemory.trim()) {
          setMemory(prev => {
            if (prev.includes(data.updateMemory)) return prev;
            return [...prev, data.updateMemory];
          });
          addAutomationLog(`Memory Vault updated: ${data.updateMemory}`, "completed");
        }

        // Process Device Automation Plan
        if (data.actions && data.actions.length > 0) {
          executeAutomatedActions(data.actions);
        } else {
          addAutomationLog("Conversation context analyzed. No physical device automation needed.", "completed");
        }
      }

    } catch (err) {
      console.error(err);
      setIsTyping(false);
      addAutomationLog("Auroza engine communication failure.", "failed");
    }
  };

  // Toggle Live Microphone Listening state
  const handleToggleMic = () => {
    if (isListening) {
      setIsListening(false);
      setMicPulse(false);
      setIsFloatingActive(false);
      addAutomationLog("لائیو وائس موڈ بند کر دیا گیا ہے۔", "completed");
    } else {
      if (!permissions.microphone) {
        alert("براہ کرم پہلے بائیں جانب پرمیشن مینیجر میں مائیکروفون کی اجازت دیں!");
        addAutomationLog("مائیکروفون کی اجازت نہیں ملی۔ آواز کا فنکشن بلاک ہے۔", "failed");
        return;
      }
      setIsListening(true);
      setIsFloatingActive(true);
      addAutomationLog("لائیو آواز کی ریکارڈنگ شروع کر دی گئی ہے۔", "running");
    }
  };

  // Action Orchestration Engine (The Android Automator)
  const executeAutomatedActions = async (actions: DeviceAction[]) => {
    for (const action of actions) {
      addAutomationLog(`Planning action: ${action.type.toUpperCase()}`, "pending");
      await new Promise(r => setTimeout(r, 800)); // natural automation pacing

      switch (action.type) {
        case "open_app":
          const app = action.payload?.appName?.toLowerCase() || "";
          addAutomationLog(`Synthesizing hand gestures. Launching ${action.payload?.appName}...`, "running");
          await new Promise(r => setTimeout(r, 1000));
          
          if (app.includes("whatsapp")) {
            setActiveScreen("whatsapp");
            if (action.payload?.message) {
              setSmsText(action.payload.message);
            }
            if (action.payload?.phoneNumber || action.payload?.contactName) {
              setSmsContact(action.payload.phoneNumber || action.payload.contactName || "");
            }
            addAutomationLog(`WhatsApp app rendered onto primary view screen successfully.`, "completed");
          } else if (app.includes("settings")) {
            setActiveScreen("settings");
            addAutomationLog(`Android System Settings drawer opened.`, "completed");
          } else if (app.includes("youtube") || app.includes("video")) {
            setActiveScreen("youtube");
            if (action.payload?.query) {
              setYoutubeQuery(action.payload.query);
            }
            addAutomationLog(`YouTube container initiated.`, "completed");
          } else if (app.includes("facebook") || app.includes("instagram") || app.includes("tiktok") || app.includes("x") || app.includes("twitter")) {
            addAutomationLog(`Virtual Sandbox: Successfully spawned overlay for ${action.payload?.appName}.`, "completed");
            alert(`[Virtual Phone Simulation] Opened external App: ${action.payload?.appName}`);
          } else {
            setActiveScreen("home");
            addAutomationLog(`Opened home launcher application ${action.payload?.appName}`, "completed");
          }
          break;

        case "make_call":
          if (!permissions.phone) {
            addAutomationLog("Calling blocked. Phone Permission is denied.", "failed");
            alert("Dialing request made but Phone permission is offline on device launcher.");
            return;
          }
          setActiveScreen("dialer");
          const dialNum = action.payload?.phoneNumber || "0300-1234567";
          setPhoneDialNum(dialNum);
          setActiveCallContact(action.payload?.contactName || "Contact");
          addAutomationLog(`Initiated connection string to ${dialNum}... Calling.`, "completed");
          break;

        case "send_sms":
          if (!permissions.sms) {
            addAutomationLog("Message cancelled. SMS Permission is offline.", "failed");
            return;
          }
          setActiveScreen("whatsapp"); // Shared messaging simulator
          setSmsContact(action.payload?.contactName || action.payload?.phoneNumber || "Unknown");
          setSmsText(action.payload?.message || "Assalam-o-Alaikum! Sent via Auroza AI automation.");
          addAutomationLog(`Polished automated SMS text fields.`, "completed");
          break;

        case "create_reminder":
          const title = action.payload?.title || "Simulated Task";
          const newRem = { id: Date.now().toString(), title, done: false };
          setReminders(prev => [...prev, newRem]);
          addAutomationLog(`Injected alarm calendar entry: "${title}"`, "completed");
          break;

        case "search_web":
          setActiveScreen("home");
          const q = action.payload?.query || "weather report PK";
          setWebQuery(q);
          addAutomationLog(`Web scraping system queried: "${q}"`, "completed");
          break;

        case "play_youtube":
          setActiveScreen("youtube");
          const yq = action.payload?.query || "Auroza Voice Theme";
          setYoutubeQuery(yq);
          addAutomationLog(`Query injected into YouTube core: "${yq}"`, "completed");
          break;

        case "search_ecommerce":
          setActiveScreen("ecommerce");
          setEcommerceQuery(action.payload?.item || "Smart Android TV");
          setEcommercePlatform(action.payload?.platform || "Daraz");
          addAutomationLog(`Parsed e-commerce lookup string on ${action.payload?.platform || "Daraz"}.`, "completed");
          break;

        case "open_camera":
          if (!permissions.camera) {
            addAutomationLog("Access forbidden. Camera permission disabled.", "failed");
            alert("Auroza requires live camera frames. Please toggle Camera Permission on.");
            return;
          }
          setActiveScreen("camera");
          addAutomationLog("Android digital camera hardware engaged successfully.", "completed");
          break;

        case "open_gallery":
          setActiveScreen("gallery");
          addAutomationLog("Opened phone digital assets folder.", "completed");
          break;

        case "generate_image":
          const prompt = action.payload?.prompt || "A beautiful high-fidelity picture";
          addAutomationLog(`AI Drawing Engine: Spawning neural generator for: "${prompt}"...`, "running");
          await new Promise(r => setTimeout(r, 2000));
          const generatedUrl = `https://image.pollinations.ai/p/${encodeURIComponent(prompt)}?width=768&height=768&nologo=true`;
          
          setGalleryImages(prev => [generatedUrl, ...prev]);
          addAutomationLog(`✓ Successfully generated AI image. Transferred to Gallery!`, "completed");
          setActiveScreen("gallery"); // Instantly switch to phone's Gallery view
          break;

        default:
          addAutomationLog(`Simulated execute action completed: ${action.type}`, "completed");
      }
    }
  };

  // Hardware Camera Feed Access Simulator
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.warn("No real webcam found, using animated mock lens feed.", e);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleCapturePhoto = async () => {
    if (!permissions.camera) {
      alert("Camera Permission is turned off. Toggle it in the Permission panel first!");
      return;
    }

    // Capture simulation via canvas or static generator
    addAutomationLog("Synthesizing snap frames from device lens...", "running");
    let base64 = "";

    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          base64 = canvas.toDataURL("image/jpeg");
        }
      }
    } catch {}

    // Fallback beautiful snapshot
    if (!base64) {
      base64 = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400&q=80";
    }

    setCapturedImage(base64);
    addAutomationLog("Captured snapshot successfully. Analysing via Vision model...", "pending");

    try {
      const response = await fetch("/api/auroza/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          prompt: "Analyze what you see on the camera. What objects, environment, or details are present?",
          assistantName: config.name,
          language: config.language
        })
      });

      const data = await response.json();
      if (data.message) {
        const assistantMsg: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: `📸 **Vision Capture Analysis:**\n\n${data.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, assistantMsg]);
        speakText(data.message);
        addAutomationLog("Visual processing analysis successfully completed by Gemini Vision.", "completed");
      }
    } catch (e) {
      addAutomationLog("Vision processing server exception.", "failed");
    }
  };

  // Drag and drop image attachment logic
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
        addAutomationLog("Custom visual asset dropped onto assistant console.", "completed");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div 
      className="flex flex-col items-center justify-center h-full bg-slate-950 p-6 relative overflow-hidden"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
    >
      {/* Background Decorative Gradient Rings */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-[120px] pointer-events-none"></div>

      {/* Floating Assistant Bubble (Draggable everywhere) */}
      {isFloatingActive && (
        <div 
          id="draggable-floating-bubble"
          onMouseDown={startDrag}
          style={{ 
            left: `${bubblePos.x}px`, 
            top: `${bubblePos.y}px`,
            position: "absolute",
            zIndex: 9999
          }}
          className="bg-gradient-to-tr from-cyan-500 via-indigo-500 to-pink-500 p-0.5 rounded-2xl shadow-2xl shadow-cyan-500/30 cursor-grab active:cursor-grabbing hover:scale-110 transition-transform duration-150 animate-bounce"
        >
          <div className="bg-slate-900 px-3 py-2.5 rounded-2xl flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <div className="text-left select-none">
              <div className="text-[10px] font-mono text-slate-400 leading-tight">Live Voice</div>
              <div className="text-xs font-sans font-bold text-slate-100">{config.name}</div>
            </div>
            <button 
              id="close-floating-bubble-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsFloatingActive(false);
              }} 
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modern High-End Phone Shell Container */}
      <div 
        id="phone-shell-container"
        className="relative w-full max-w-[390px] aspect-[9/19.5] bg-black rounded-[52px] border-[6px] border-slate-800 shadow-[0_0_80px_-15px_rgba(6,182,212,0.15)] flex flex-col overflow-hidden"
      >
        {/* Dynamic Island Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50 flex items-center justify-between px-3.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800/50"></div>
          <span className="text-[9px] font-mono font-bold text-cyan-400 tracking-wider">AUROZA v1.0</span>
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-900"></div>
        </div>

        {/* Status Bar */}
        <div className="h-10 bg-slate-950 flex items-end justify-between px-6 pb-1.5 text-xs text-slate-400 font-medium select-none z-40">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-3.5 h-3.5" />
            <span className="text-[9px] font-mono font-bold text-emerald-400">98%</span>
          </div>
        </div>

        {/* Dynamic Display Area */}
        <div className="flex-1 bg-slate-950 flex flex-col relative overflow-hidden text-slate-200">
          
          {/* Main Simulated Screen Views */}
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative">
            
            {activeScreen === "home" && (
              <div id="screen-home" className="flex-1 flex flex-col p-4.5 space-y-4">
                
                {/* Material 3 Styled Top Branding Banner */}
                <div className="flex items-center justify-between bg-slate-900/40 border border-slate-900 rounded-3xl p-3.5 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-md shadow-cyan-500/10">
                      <Sparkles className="w-4.5 h-4.5 text-slate-950" />
                    </div>
                    <div>
                      <h3 className="text-xs font-mono tracking-widest text-slate-400 font-bold uppercase">Auroza v1.0</h3>
                      <p className="text-[10px] text-cyan-400 font-medium">Material Design 3 Interface</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="text-[9px] font-medium bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-900/50">
                      {config.language}
                    </span>
                    <span className="text-[9px] font-medium bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-900/50">
                      {config.style}
                    </span>
                  </div>
                </div>

                {/* Animated Central Voice Assistant Orb (The Core Feature) */}
                <div className="flex flex-col items-center justify-center py-4 bg-slate-900/20 border border-slate-900/50 rounded-[32px] p-4 relative overflow-hidden shadow-inner">
                  
                  {/* Ripple Ring Wave Effects when Active */}
                  {isListening && (
                    <>
                      <div className="absolute w-44 h-44 bg-cyan-500/5 rounded-full animate-ping pointer-events-none"></div>
                      <div className="absolute w-36 h-36 bg-indigo-500/10 rounded-full animate-pulse pointer-events-none"></div>
                    </>
                  )}

                  {/* Central interactive orb button */}
                  <button
                    id="central-voice-orb-btn"
                    onClick={handleToggleMic}
                    className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 transform active:scale-95 shadow-2xl ${
                      isListening
                        ? "bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 scale-105 shadow-cyan-500/30"
                        : "bg-slate-900 border-2 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white hover:shadow-slate-800/10"
                    }`}
                  >
                    {/* Glowing outer aura */}
                    <div className={`absolute inset-0.5 rounded-full bg-slate-950/10 backdrop-blur-sm transition-all duration-300 ${isListening ? "opacity-0" : "opacity-100"}`}></div>
                    
                    <div className="z-10 flex flex-col items-center justify-center">
                      {isListening ? (
                        <div className="relative">
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                          <Mic className="w-8 h-8 text-slate-950 animate-pulse" />
                        </div>
                      ) : (
                        <Mic className="w-7 h-7 text-cyan-400 hover:text-cyan-300 transition-colors" />
                      )}
                    </div>
                  </button>

                  {/* Voice Status & Indicator text */}
                  <div className="mt-3 text-center z-10">
                    <p className={`text-xs font-bold transition-colors ${isListening ? "text-cyan-400 animate-pulse" : "text-slate-300"}`}>
                      {isListening ? "سن رہا ہوں... بولنا شروع کریں" : "ٹیپ کر کے بات کریں"}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {isListening ? "Live Web Speech Recognition" : "Web Speech API Activated"}
                    </p>
                  </div>
                </div>

                {/* Live Message History / Conversations List (Directly on Home) */}
                <div className="bg-slate-900/30 border border-slate-900 rounded-[28px] p-3.5 flex-1 flex flex-col space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-900/80 pb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">حالیہ گفتگو (Recent Chat)</span>
                    <button 
                      onClick={() => setActiveScreen("history")}
                      className="text-[10px] font-medium text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      پوری ہسٹری <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[140px] pr-1 custom-scrollbar">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center py-4 text-center">
                        <MessageSquare className="w-5 h-5 text-slate-600 mb-1" />
                        <p className="text-[11px] text-slate-500">ابھی کوئی بات چیت نہیں ہوئی۔ نیچے سے ٹائپ کریں یا اوپر مائیک کو دبائیں۔</p>
                      </div>
                    ) : (
                      messages.slice(-3).map((m) => (
                        <div key={m.id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                          <div className={`max-w-[85%] p-2.5 rounded-[20px] text-xs leading-relaxed ${
                            m.role === "user" 
                              ? "bg-cyan-950/75 text-cyan-100 rounded-tr-sm border border-cyan-900/40" 
                              : "bg-slate-900 text-slate-200 rounded-tl-sm border border-slate-800"
                          }`}>
                            <p className="font-sans break-words">{m.content}</p>
                          </div>
                          <span className="text-[8px] text-slate-600 font-mono mt-0.5 px-1">{m.timestamp}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Horizontal Drawer: Android App shortcuts */}
                <div>
                  <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2 font-bold px-1">ایپس اور ٹولز (Simulated Apps)</h4>
                  <div className="flex gap-2.5 overflow-x-auto pb-2 px-1 custom-scrollbar">
                    {[
                      { id: "whatsapp", label: "WhatsApp", icon: MessageSquare, color: "bg-emerald-500/10 text-emerald-400 border-emerald-950" },
                      { id: "youtube", label: "YouTube", icon: Youtube, color: "bg-red-500/10 text-red-400 border-red-950" },
                      { id: "ecommerce", label: "Shopping", icon: Compass, color: "bg-amber-500/10 text-amber-400 border-amber-950" },
                      { id: "dialer", label: "Phone", icon: Phone, color: "bg-cyan-500/10 text-cyan-400 border-cyan-950" },
                      { id: "camera", label: "Camera", icon: Camera, color: "bg-indigo-500/10 text-indigo-400 border-indigo-950" },
                      { id: "gallery", label: "Photos", icon: ImageIcon, color: "bg-pink-500/10 text-pink-400 border-pink-950" },
                      { id: "settings", label: "Settings", icon: SettingsIcon, color: "bg-slate-900 text-slate-300 border-slate-800" }
                    ].map((app) => (
                      <button 
                        key={app.id} 
                        id={`phone-app-btn-${app.id}`}
                        onClick={() => {
                          setActiveScreen(app.id as ActivePhoneApp);
                          addAutomationLog(`Launched simulated ${app.label} app.`, "completed");
                        }}
                        className="flex flex-col items-center flex-shrink-0 space-y-1.5"
                      >
                        <div className={`w-11 h-11 ${app.color} border rounded-2xl flex items-center justify-center shadow-sm transition transform active:scale-95 hover:brightness-110`}>
                          <app.icon className="w-5 h-5" />
                        </div>
                        <span className="text-[9px] font-medium text-slate-400 truncate max-w-[56px] text-center">{app.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Material Checklist Card: Reminders */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-[28px] p-3 space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-pink-400" />
                      <span className="text-[11px] font-bold text-slate-300">الارمز اور یاد دہانیاں (Alarms)</span>
                    </div>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 bg-slate-950 text-pink-400 rounded-full border border-pink-950">Active</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {reminders.slice(0, 2).map((rem) => (
                      <div key={rem.id} className="flex items-center justify-between bg-slate-950 p-2 rounded-xl text-[10px] border border-slate-900">
                        <span className={`truncate text-slate-300 ${rem.done ? "line-through text-slate-500" : ""}`}>{rem.title}</span>
                        <input 
                          type="checkbox" 
                          checked={rem.done} 
                          onChange={() => setReminders(prev => prev.map(r => r.id === rem.id ? { ...r, done: !r.done } : r))}
                          className="rounded-md border-slate-850 text-pink-500 focus:ring-pink-500 w-3.5 h-3.5" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Simulated WhatsApp Drawer */}
            {activeScreen === "whatsapp" && (
              <div id="screen-whatsapp" className="flex-1 flex flex-col">
                <div className="bg-emerald-950/80 px-4 py-3 flex items-center justify-between border-b border-emerald-800/50">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActiveScreen("home")} className="text-emerald-400">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h3 className="text-xs font-bold text-emerald-100">WhatsApp Automation</h3>
                      <p className="text-[9px] text-emerald-400">Auroza Automated Text Agent</p>
                    </div>
                  </div>
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">To (Contact / Name / Phone)</label>
                      <input 
                        id="whatsapp-contact-input"
                        type="text" 
                        value={smsContact}
                        onChange={(e) => setSmsContact(e.target.value)}
                        placeholder="e.g., Dad, Ahmed, or +923001234567"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Message Text</label>
                      <textarea 
                        id="whatsapp-msg-textarea"
                        rows={3}
                        value={smsText}
                        onChange={(e) => setSmsText(e.target.value)}
                        placeholder="What should Auroza type?"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>
                  </div>
                  <button 
                    id="whatsapp-send-sms-btn"
                    onClick={() => {
                      if (!smsContact || !smsText) {
                        alert("Contact name and message body must be present!");
                        return;
                      }
                      addAutomationLog(`Sending WhatsApp message to ${smsContact}: "${smsText}"`, "running");
                      setTimeout(() => {
                        alert(`[WhatsApp Automation API] Simulated message dispatched to ${smsContact}!`);
                        addAutomationLog(`WhatsApp chat sent successfully.`, "completed");
                        setSmsText("");
                      }, 1000);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-slate-100 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </button>
                </div>
              </div>
            )}

            {/* Simulated YouTube Screen */}
            {activeScreen === "youtube" && (
              <div id="screen-youtube" className="flex-1 flex flex-col bg-slate-950">
                <div className="bg-red-950/60 px-4 py-3 flex items-center justify-between border-b border-red-950/80">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActiveScreen("home")} className="text-red-400">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h3 className="text-xs font-bold text-red-100">YouTube Assistant</h3>
                  </div>
                  <Youtube className="w-4 h-4 text-red-500 animate-pulse" />
                </div>
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input 
                        id="youtube-search-input"
                        type="text"
                        placeholder="Search songs, tutorials, trailers..."
                        value={youtubeQuery}
                        onChange={(e) => setYoutubeQuery(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-red-500"
                      />
                      <button 
                        id="youtube-search-btn"
                        onClick={() => {
                          addAutomationLog(`YouTube scraper searching for: "${youtubeQuery}"`, "completed");
                        }}
                        className="bg-red-600 text-white px-3 py-1 text-xs rounded-lg"
                      >
                        Search
                      </button>
                    </div>

                    {/* YouTube Video Simulated Iframe / Content */}
                    <div className="bg-slate-900 border border-slate-850 rounded-xl aspect-video flex flex-col items-center justify-center p-4 text-center">
                      <Youtube className="w-10 h-10 text-red-500 mb-2" />
                      <p className="text-xs font-bold text-slate-200 truncate w-full">
                        {youtubeQuery ? `Playing: ${youtubeQuery}` : "Search or request video automation"}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">Virtual Android stream rendering</p>
                    </div>
                  </div>
                  
                  {youtubeQuery && (
                    <a 
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-red-500" />
                      <span>Launch Live on YouTube</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Simulated Shopping / E-commerce Screen */}
            {activeScreen === "ecommerce" && (
              <div id="screen-ecommerce" className="flex-1 flex flex-col">
                <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActiveScreen("home")} className="text-slate-400">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h3 className="text-xs font-bold text-slate-100">Shop Automator</h3>
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => setEcommercePlatform("Amazon")}
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${ecommercePlatform === "Amazon" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400"}`}
                    >
                      Amazon
                    </button>
                    <button 
                      onClick={() => setEcommercePlatform("Daraz")}
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${ecommercePlatform === "Daraz" ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400"}`}
                    >
                      Daraz
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-4 flex-1">
                  <div className="flex gap-2">
                    <input 
                      id="ecommerce-item-input"
                      type="text"
                      placeholder="Search phones, clothes, gadgets..."
                      value={ecommerceQuery}
                      onChange={(e) => setEcommerceQuery(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                    />
                  </div>

                  <div className="bg-slate-900 rounded-xl p-4 border border-slate-850 space-y-3">
                    <h4 className="text-xs font-mono font-bold text-slate-300">Autopilot Search Result:</h4>
                    {ecommerceQuery ? (
                      <div className="space-y-2">
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-slate-200">Simulated {ecommerceQuery}</p>
                            <p className="text-[10px] text-slate-500">Platform: {ecommercePlatform}</p>
                          </div>
                          <span className="text-emerald-400 font-bold font-mono">$129.99</span>
                        </div>
                        <a 
                          href={ecommercePlatform === "Amazon" 
                            ? `https://www.amazon.com/s?k=${encodeURIComponent(ecommerceQuery)}` 
                            : `https://www.daraz.pk/catalog/?q=${encodeURIComponent(ecommerceQuery)}`
                          }
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-cyan-400 hover:underline flex items-center gap-1.5 mt-2"
                        >
                          <span>Open full listing on {ecommercePlatform}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">Ask Auroza to look up products on Daraz or Amazon.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Simulated Dialer Screen */}
            {activeScreen === "dialer" && (
              <div id="screen-dialer" className="flex-1 flex flex-col justify-between p-5 bg-slate-950">
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveScreen("home")} className="text-slate-400">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-xs font-bold text-slate-100">Phone Caller</h3>
                </div>

                <div className="text-center space-y-2 py-4">
                  <p className="text-[11px] font-mono tracking-widest text-slate-500">DIALING NETWORK</p>
                  <h2 className="text-2xl font-mono font-bold text-slate-200 tracking-wider">
                    {phoneDialNum || "Enter Number"}
                  </h2>
                  {activeCallContact && (
                    <p className="text-xs font-sans text-cyan-400 font-medium">Calling: {activeCallContact}</p>
                  )}
                </div>

                {/* Dialpad Sim */}
                <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((num) => (
                    <button 
                      key={num}
                      onClick={() => setPhoneDialNum(prev => prev + num)}
                      className="w-12 h-12 rounded-full bg-slate-900 hover:bg-slate-800 font-mono text-base font-bold text-slate-300 flex items-center justify-center transition active:scale-90"
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <div className="flex justify-center gap-4 pt-4">
                  <button 
                    onClick={() => {
                      if (!phoneDialNum) return;
                      addAutomationLog(`Calling ${phoneDialNum}...`, "running");
                      setTimeout(() => {
                        alert(`[Dialer Simulation] Connecting call to ${phoneDialNum}...`);
                        addAutomationLog(`Call answered successfully by simulated peer.`, "completed");
                      }, 1000);
                    }}
                    className="w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center transition active:scale-90"
                  >
                    <Phone className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => {
                      setPhoneDialNum("");
                      setActiveCallContact(null);
                    }}
                    className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition active:scale-90"
                  >
                    <MicOff className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}

            {/* Simulated Live Camera with Vision snap capabilities */}
            {activeScreen === "camera" && (
              <div id="screen-camera" className="flex-1 flex flex-col bg-black">
                <div className="px-4 py-3 flex items-center justify-between border-b border-slate-900 z-10 bg-slate-950">
                  <button onClick={() => {
                    stopCamera();
                    setActiveScreen("home");
                  }} className="text-slate-400">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-xs font-bold text-slate-100">Auroza Lens Vision</h3>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                </div>

                <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover absolute inset-0"
                  />
                  
                  {/* Digital Lens overlay */}
                  <div className="absolute inset-4 border border-cyan-500/20 rounded-2xl pointer-events-none flex items-center justify-center">
                    <div className="w-8 h-8 border-t-2 border-l-2 border-cyan-400 absolute top-0 left-0 rounded-tl"></div>
                    <div className="w-8 h-8 border-t-2 border-r-2 border-cyan-400 absolute top-0 right-0 rounded-tr"></div>
                    <div className="w-8 h-8 border-b-2 border-l-2 border-cyan-400 absolute bottom-0 left-0 rounded-bl"></div>
                    <div className="w-8 h-8 border-b-2 border-r-2 border-cyan-400 absolute bottom-0 right-0 rounded-br"></div>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-800 p-2 rounded-xl text-center">
                    <p className="text-[10px] text-slate-300 font-mono">
                      {isSandbox ? "Sandbox Lens ready. Press Capture to send to AI." : "Press capture to analyze feed with Gemini Vision."}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 flex justify-center items-center gap-6">
                  <button 
                    onClick={() => {
                      setActiveScreen("gallery");
                    }}
                    className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <button 
                    id="camera-shutter-btn"
                    onClick={handleCapturePhoto}
                    className="w-16 h-16 rounded-full border-4 border-slate-100 bg-red-600 hover:bg-red-700 active:scale-95 transition flex items-center justify-center"
                  >
                    <span className="w-6 h-6 rounded-full bg-white"></span>
                  </button>
                  <button 
                    onClick={() => setActiveScreen("home")}
                    className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300"
                  >
                    <Home className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Gallery / Photos Screen */}
            {activeScreen === "gallery" && (
              <div id="screen-gallery" className="flex-1 flex flex-col bg-slate-950">
                <div className="px-4 py-3 flex items-center justify-between border-b border-slate-900 bg-slate-950">
                  <button onClick={() => setActiveScreen("home")} className="text-slate-400">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-xs font-bold text-slate-100">Gallery Assets</h3>
                  <ImageIcon className="w-4 h-4 text-pink-400" />
                </div>
                <div className="p-4 grid grid-cols-2 gap-3 overflow-y-auto">
                  {galleryImages.map((img, i) => (
                    <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                      <img src={img} alt="Gallery item" className="w-full h-full object-cover" />
                      <button 
                        onClick={async () => {
                          setCapturedImage(img);
                          addAutomationLog(`Sending asset ${i + 1} to Vision agent...`, "pending");
                          try {
                            const response = await fetch("/api/auroza/vision", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                imageBase64: img,
                                prompt: "Describe what is in this gallery photo",
                                assistantName: config.name,
                                language: config.language
                              })
                            });
                            const data = await response.json();
                            if (data.message) {
                              setMessages(prev => [...prev, {
                                id: Date.now().toString(),
                                role: "assistant",
                                content: `🖼️ **Visual Asset Analysis:**\n\n${data.message}`,
                                timestamp: new Date().toLocaleTimeString()
                              }]);
                              speakText(data.message);
                              addAutomationLog("Gallery asset analyzed successfully.", "completed");
                            }
                          } catch {
                            addAutomationLog("Asset analyzer processing failed.", "failed");
                          }
                        }}
                        className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[11px] text-pink-300 font-bold transition duration-200"
                      >
                        <Search className="w-4 h-4 mb-1" />
                        <span>Analyze Visual</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Simulated Settings Panel */}
            {activeScreen === "settings" && (
              <div id="screen-settings" className="flex-1 flex flex-col bg-slate-950 p-4 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <button onClick={() => setActiveScreen("home")} className="text-slate-400">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-xs font-bold text-slate-100">Android System Emulator</h3>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-mono font-bold text-cyan-400">Environment Metadata</h4>
                    <div className="text-[10px] space-y-1 font-mono text-slate-400">
                      <p>• Model: models/gemini-3.5-flash</p>
                      <p>• Micro-engine latency: &lt;120ms</p>
                      <p>• Voice feedback: Enabled</p>
                      <p>• Continuous listening: Active (Web Speech API)</p>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-1">
                    <h4 className="text-xs font-sans font-bold text-slate-200">Device Hardware Specs</h4>
                    <div className="text-[10px] text-slate-400 space-y-1">
                      <div className="flex justify-between"><span>CPU Core load</span><span className="text-emerald-400 font-mono">14%</span></div>
                      <div className="flex justify-between"><span>RAM Allocated</span><span className="text-emerald-400 font-mono">512MB</span></div>
                      <div className="flex justify-between"><span>API Gateway</span><span className="text-cyan-400 font-mono">Active</span></div>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-1">
                    <h4 className="text-xs font-sans font-bold text-slate-200">Reset State</h4>
                    <p className="text-[10px] text-slate-500 pb-2">Wipe conversation timeline and cognitive memory banks.</p>
                    <button 
                      onClick={() => {
                        setMessages([]);
                        setMemory([]);
                        addAutomationLog("System and memory databases completely reset.", "completed");
                        alert("Reset successful.");
                      }}
                      className="w-full bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-red-300 font-bold py-1.5 rounded-lg text-xs transition"
                    >
                      Hard Reset Space
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Conversation/Chat History Overlay Drawer */}
            {activeScreen === "history" && (
              <div id="screen-history" className="flex-1 flex flex-col bg-slate-950">
                <div className="px-4 py-3 flex items-center justify-between border-b border-slate-900 bg-slate-950">
                  <button onClick={() => setActiveScreen("home")} className="text-slate-400">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-xs font-bold text-slate-100">Conversation Vault</h3>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-900 text-slate-400 rounded">Logs</span>
                </div>
                <div className="p-4 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                  {messages.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No chat history logged in current session.</p>
                  ) : (
                    messages.map((m) => (
                      <div key={m.id} className={`p-2.5 rounded-xl border text-xs ${m.role === "user" ? "bg-slate-900/60 border-slate-800" : "bg-cyan-950/20 border-cyan-900/50"}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className={`font-bold capitalize text-[10px] ${m.role === "user" ? "text-slate-300" : "text-cyan-400"}`}>{m.role}</span>
                          <span className="text-[9px] text-slate-500">{m.timestamp}</span>
                        </div>
                        <p className="text-slate-300">{m.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Dedicated ChatGPT-like Inline Conversations Console (The core Chat Interface) */}
          <div className="border-t border-slate-900 bg-slate-950/95 backdrop-blur p-3.5 space-y-3">
            
            {/* Visual Waveform when Mic is alive */}
            {micPulse && (
              <div className="flex flex-col gap-1.5 p-2 bg-cyan-950/40 border border-cyan-800/40 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                    <span className="text-[10px] font-semibold text-cyan-400">مائیکرو فون ایکٹیو ہے...</span>
                  </div>
                  <span className="text-[9px] font-mono text-cyan-500 italic">Web Speech API</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[...Array(6)].map((_, i) => (
                      <span key={i} className="w-1 bg-cyan-400 rounded-full animate-pulse" style={{ height: `${Math.random() * 16 + 6}px`, animationDelay: `${i * 0.1}s` }}></span>
                    ))}
                  </div>
                  <p className="text-xs font-medium text-slate-200 line-clamp-2 leading-relaxed">
                    {speechFeedback || "بولیں، میں سن رہا ہوں..."}
                  </p>
                </div>
              </div>
            )}

            {/* Selected Camera visual preview thumb attachment */}
            {capturedImage && (
              <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                    <img src={capturedImage} alt="lens payload" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-300">Camera Lens Snapshot</p>
                    <p className="text-[10px] text-slate-500">Sent with next visual prompt</p>
                  </div>
                </div>
                <button 
                  id="remove-captured-image-btn"
                  onClick={() => setCapturedImage(null)} 
                  className="text-slate-500 hover:text-red-400 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Quick Interactive Command Suggestion Bar */}
            <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
              {[
                { label: "Facebook کھولو", text: "Open Facebook" },
                { label: "احمد کو کال کرو", text: "Call Ahmed" },
                { label: "WhatsApp پر میسج بھیجو", text: "Send message to Ahmed on WhatsApp" },
                { label: "Settings کھولو", text: "Open settings" }
              ].map((s, i) => (
                <button 
                  key={i}
                  onClick={() => handleUserSubmit(s.text)}
                  className="text-[10px] bg-slate-900 border border-slate-850 text-slate-400 rounded-full px-2.5 py-1 hover:text-slate-200 hover:border-slate-700 transition whitespace-nowrap"
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* ChatGPT Styled Message Box */}
            <div className="flex items-center gap-2">
              <button 
                id="phone-camera-shortcut-btn"
                onClick={() => {
                  setActiveScreen("camera");
                  addAutomationLog("User engaged hardware camera.", "completed");
                }}
                className="p-2 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-cyan-400 rounded-xl transition border border-slate-850/80"
                title="Camera Vision Input"
              >
                <Camera className="w-4 h-4" />
              </button>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUserSubmit(inputText);
                }}
                className="flex-1 flex items-center bg-slate-900 border border-slate-800/80 rounded-2xl px-3 py-1 focus-within:ring-2 focus-within:ring-cyan-500/50"
              >
                <input 
                  id="phone-chat-text-input"
                  type="text"
                  placeholder={`Ask ${config.name}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-transparent py-2 text-xs text-slate-200 focus:outline-none placeholder:text-slate-500"
                />

                <div className="flex items-center gap-1.5 ml-2">
                  <button 
                    id="phone-mic-trigger-btn"
                    type="button"
                    onClick={handleToggleMic}
                    className={`p-1.5 rounded-xl transition-all duration-300 ${isListening ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50 scale-105" : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-755"}`}
                    title={isListening ? "مائیکرو فون بند کریں" : "مائیکرو فون آن کریں"}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>

                  {inputText.trim() && (
                    <button 
                      id="phone-chat-submit-btn"
                      type="submit"
                      className="p-1.5 bg-gradient-to-tr from-cyan-500 to-indigo-500 text-slate-900 font-bold rounded-xl transition active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

        </div>

        {/* Real Bottom Android Navigation Pill */}
        <div className="h-8 bg-slate-950 flex items-center justify-around px-16 border-t border-slate-900/60 z-40 select-none">
          <button 
            id="phone-back-btn"
            onClick={() => setActiveScreen("home")} 
            className="text-slate-600 hover:text-slate-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button 
            id="phone-home-btn"
            onClick={() => setActiveScreen("home")} 
            className="w-10 h-3 bg-slate-700 hover:bg-slate-500 rounded-full transition"
          />
          <button 
            id="phone-history-btn"
            onClick={() => setActiveScreen("history")} 
            className="text-slate-600 hover:text-slate-400 transition"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Visual Canvas Backdrop Indicators */}
      <div className="text-center mt-4">
        <p className="text-[11px] font-mono text-slate-500">
          Auroza Autopilot Engine. Simulated with Web Speech recognition.
        </p>
      </div>
    </div>
  );
}
