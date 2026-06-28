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
  Sparkles,
  MoreVertical,
  LogOut,
  Lock,
  Keyboard
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
  setConfig: React.Dispatch<React.SetStateAction<AssistantConfig>>;
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
  setConfig,
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

  // Authentication State (Google Sign-In)
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("auroza_logged_in") === "true";
  });
  const [loggedInEmail, setLoggedInEmail] = useState(() => {
    return localStorage.getItem("auroza_email") || "ssbjaan002@gmail.com";
  });
  const [passwordInput, setPasswordInput] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Always-Active voice background settings (disabled)
  const [isAlwaysActive, setIsAlwaysActive] = useState(false);
  const [isThreeDotOpen, setIsThreeDotOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  
  // Floating Bubble State
  const [isFloatingActive, setIsFloatingActive] = useState(false);
  const [bubblePos, setBubblePos] = useState({ x: 20, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Web Speech API States
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const voiceTranscriptRef = useRef("");
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleUserSubmitRef = useRef<((text: string) => Promise<void>) | null>(null);

  // Update ref via effect to avoid temporal dead-zone errors
  useEffect(() => {
    handleUserSubmitRef.current = handleUserSubmit;
  }, [handleUserSubmit]);

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
        if (handleUserSubmitRef.current) {
          handleUserSubmitRef.current(simulateCommand);
        }
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

  // Initialize Web Speech Recognition in manual-only tap-to-talk mode
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechFeedback("Speech recognition not supported on this browser.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false; // Stop listening automatically when speaker stops
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
        voiceTranscriptRef.current = textResult;
        setSpeechFeedback(`بولا گیا ٹیکسٹ: "${textResult}"`);
      }
    };

    rec.onerror = (e: any) => {
      console.error("Speech Recognition Error:", e);
      if (e.error === "no-speech") {
        setSpeechFeedback("سن رہے ہیں... کچھ بولیے");
      } else if (e.error === "not-allowed") {
        setSpeechFeedback("مائیکروفون کی اجازت نہیں ملی۔");
      } else if (e.error === "network") {
        setSpeechFeedback("انٹرنیٹ کا مسئلہ ہے۔ مائیک دوبارہ آزمائیں۔");
      } else {
        setSpeechFeedback("آواز کو ٹیکسٹ میں تبدیل کرنے میں کچھ مسئلہ ہوا۔");
      }
      setIsListening(false);
      setMicPulse(false);
    };

    rec.onend = () => {
      setMicPulse(false);
      setIsListening(false);
      
      const speechText = voiceTranscriptRef.current.trim();
      if (speechText) {
        // Clear references so we don't submit twice or loop
        voiceTranscriptRef.current = "";
        setInputText("");
        setVoiceTranscript("");
        
        if (handleUserSubmitRef.current) {
          handleUserSubmitRef.current(speechText);
        }
      } else {
        setSpeechFeedback("ٹاک ختم ہو گئی۔");
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
  async function handleUserSubmit(text: string) {
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

        // Device automation is completely disabled in manual-only chat app mode
        addAutomationLog("Manual Chat Mode: Automation processes bypass active.", "completed");
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
      setInputText("");
      setVoiceTranscript("");
      voiceTranscriptRef.current = "";
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
          
          {!isLoggedIn ? (
            /* Google Sign-In Screen (Gmail Account Login) at Start */
            <div className="flex-1 flex flex-col justify-between p-6 bg-slate-950 relative overflow-hidden">
              {/* Background ambient lighting */}
              <div className="absolute top-10 left-10 w-28 h-28 bg-cyan-500/10 rounded-full filter blur-2xl"></div>
              <div className="absolute bottom-10 right-10 w-28 h-28 bg-indigo-500/10 rounded-full filter blur-2xl"></div>
              
              <div className="flex flex-col items-center justify-center flex-1 my-auto space-y-6 z-10 animate-fadeIn">
                {/* Google logo colored */}
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-xl p-2.5">
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                </div>

                <div className="text-center space-y-1">
                  <h2 className="text-sm font-extrabold text-slate-100 tracking-tight">Sign in with Google</h2>
                  <p className="text-[10px] text-slate-400 max-w-[240px] mx-auto leading-relaxed font-sans">
                    Auroza AI کا استعمال شروع کرنے کے لیے اپنے Gmail اکاؤنٹ سے لاگ ان کریں۔
                  </p>
                </div>

                <div className="w-full space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider ml-1">Gmail اکاؤنٹ</label>
                    <input 
                      type="email" 
                      value={loggedInEmail}
                      onChange={(e) => setLoggedInEmail(e.target.value)}
                      placeholder="ssbjaan002@gmail.com" 
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider ml-1">پاس ورڈ (Password)</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="••••••••" 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                      <span className="absolute right-3 top-2.5">
                        <Lock className="w-3.5 h-3.5 text-slate-600" />
                      </span>
                    </div>
                  </div>

                  {/* Android Permissions status */}
                  <div className="p-2.5 bg-cyan-950/25 border border-cyan-900/40 rounded-xl text-[9px] text-cyan-300 leading-relaxed flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[10px]">Android Permissions: Always Allowed</p>
                      <p className="text-slate-400 mt-0.5">سیکیورٹی پالیسی کے مطابق مائیک اور کیمرے کی تمام اجازتیں خود کار طور پر ہمیشہ کے لیے فعال (Allowed) ہیں۔</p>
                    </div>
                  </div>
                </div>

                <button
                  id="google-signin-btn"
                  disabled={authLoading}
                  onClick={() => {
                    if (!loggedInEmail.trim()) {
                      alert("براہ کرم اپنا ای میل درج کریں!");
                      return;
                    }
                    setAuthLoading(true);
                    addAutomationLog("Authenticating user via Google Accounts flow...", "running");
                    setTimeout(() => {
                      localStorage.setItem("auroza_logged_in", "true");
                      localStorage.setItem("auroza_email", loggedInEmail);
                      setIsLoggedIn(true);
                      setAuthLoading(false);
                      addAutomationLog(`Google login approved for: ${loggedInEmail}`, "completed");
                    }, 1200);
                  }}
                  className="w-full py-2.5 bg-white text-slate-950 hover:bg-slate-100 font-extrabold rounded-xl text-xs transition transform active:scale-95 shadow-md flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                      <span>لاگ ان ہو رہا ہے...</span>
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                      </svg>
                      <span>Gmail اکاؤنٹ سے مربوط کریں</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-3 border-t border-slate-900 flex items-center justify-center gap-1 text-[10px] text-slate-500 font-mono">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>Google Secure Auth Gate</span>
              </div>
            </div>
          ) : (
            <>
              {/* Immersive ChatGPT/Gemini Header */}
              <div className="px-4 py-3 border-b border-slate-900 bg-slate-950/90 backdrop-blur flex items-center justify-between z-30 select-none relative">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-100 tracking-wide">Auroza v1.0</h3>
                    {isAlwaysActive && (
                      <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-900/30 animate-pulse">
                        Always-Active Mic ON
                      </span>
                    )}
                  </div>
                </div>

                {/* Top Right Action Dropdown */}
                <div className="flex items-center gap-1.5 relative">
                  <span className="hidden xs:inline-block text-[9px] text-slate-500 font-mono truncate max-w-[110px]">
                    {loggedInEmail}
                  </span>
                  
                  <button 
                    id="header-three-dot-menu-btn"
                    onClick={() => setIsThreeDotOpen(!isThreeDotOpen)}
                    className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg transition"
                    title="Menu & Sync"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Settings & History Dropdown */}
                  {isThreeDotOpen && (
                    <div className="absolute right-0 top-10 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-1.5">
                      <div className="px-3 py-2 border-b border-slate-800/80">
                        <p className="text-[10px] text-slate-400 font-mono leading-tight">سائن ان اکاؤنٹ</p>
                        <p className="text-[11px] font-bold text-slate-200 truncate">{loggedInEmail}</p>
                        <div className="flex items-center gap-1 mt-1 text-[8px] text-emerald-400 font-mono">
                          <Check className="w-3 h-3" />
                          <span>Permissions: Always Allowed</span>
                        </div>
                      </div>

                      <div className="py-1">
                        <button 
                          onClick={() => {
                            if (confirm("کیا آپ واقعی گفتگو صاف کرنا چاہتے ہیں؟")) {
                              setMessages([]);
                              addAutomationLog("Conversation timeline reset successfully.", "completed");
                            }
                            setIsThreeDotOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition text-left"
                        >
                          <X className="w-3.5 h-3.5 text-pink-400" />
                          <span>ہسٹری صاف کریں</span>
                        </button>

                        <button 
                          onClick={() => {
                            localStorage.removeItem("auroza_logged_in");
                            setIsLoggedIn(false);
                            setIsThreeDotOpen(false);
                            addAutomationLog("Signed out from Google account.", "completed");
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition text-left mt-1 border-t border-slate-800/60"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>لاگ آؤٹ کریں</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Simulated Screen Views */}
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative bg-slate-950">
                
                <div id="screen-home" className="flex-1 flex flex-col p-4 space-y-4">
                  
                  {/* Material 3 Styled Top Branding Banner */}
                  <div className="flex items-center justify-between bg-slate-900/40 border border-slate-900 rounded-3xl p-3.5 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-md shadow-cyan-500/10">
                        <Sparkles className="w-4.5 h-4.5 text-slate-950" />
                      </div>
                      <div>
                        <h3 className="text-xs font-mono tracking-widest text-slate-400 font-bold uppercase">Auroza Chat</h3>
                        <p className="text-[10px] text-cyan-400 font-medium">Static Chat Interface</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="text-[9px] font-medium bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-900/50">
                        {config.language}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Conversations Stream / Gemini Message Bubbles List */}
                  <div className="flex-1 overflow-y-auto space-y-4 px-1 pr-1.5 custom-scrollbar min-h-[220px]">
                    {messages.length === 0 ? (
                      /* Minimalist Distraction-Free Empty Chat Area */
                      <div className="flex-1 h-full flex flex-col items-center justify-center py-12 space-y-4 select-none animate-fadeIn">
                        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800/60 flex items-center justify-center shadow-lg text-cyan-400">
                          <Sparkles className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-xs font-bold text-slate-300 font-sans tracking-wide">Auroza AI</p>
                          <p className="text-[10px] text-slate-500 font-sans">گفتگو شروع کرنے کے لیے مائیک کو دبائیں</p>
                        </div>
                      </div>
                    ) : (
                      /* Bubble Chat Layout (ChatGPT/Gemini Style) */
                      <div className="space-y-4 flex flex-col pt-2">
                        {messages.map((m) => (
                          <div 
                            key={m.id} 
                            className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"} animate-fadeIn`}
                          >
                            {/* Name Header above bubble */}
                            <span className={`text-[9px] font-mono tracking-wider mb-1 px-1 font-bold ${
                              m.role === "user" ? "text-cyan-400" : "text-indigo-400"
                            }`}>
                              {m.role === "user" ? "You" : config.name}
                            </span>

                            <div className={`max-w-[85%] p-3 rounded-2xl leading-relaxed text-xs shadow-sm ${
                              m.role === "user" 
                                ? "bg-gradient-to-tr from-cyan-950/70 to-indigo-950/70 text-cyan-50 rounded-tr-sm border border-cyan-900/50" 
                                : "bg-slate-900 text-slate-200 rounded-tl-sm border border-slate-800"
                            }`}>
                              <p className="font-sans break-words whitespace-pre-wrap">{m.content}</p>
                            </div>
                            <span className="text-[8px] text-slate-600 font-mono mt-1 px-1">{m.timestamp}</span>
                          </div>
                        ))}

                        {/* AI Typing Indicator */}
                        {isTyping && (
                          <div className="flex flex-col items-start animate-fadeIn">
                            <span className="text-[9px] font-mono tracking-wider mb-1 px-1 font-bold text-indigo-400">
                              {config.name}
                            </span>
                            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl rounded-tl-sm shadow-sm">
                              <div className="flex items-center space-x-1.5 px-1 py-0.5">
                                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce"></div>
                              </div>
                            </div>
                            <span className="text-[8px] text-slate-600 font-mono mt-1 px-1">Typing...</span>
                          </div>
                        )}

                        {/* User Typing or Speaking Indicator */}
                        {isListening && (
                          <div className="flex flex-col items-end animate-fadeIn">
                            <span className="text-[9px] font-mono tracking-wider mb-1 px-1 font-bold text-cyan-400">
                              You
                            </span>
                            <div className="bg-gradient-to-tr from-cyan-950/50 to-indigo-950/50 border border-cyan-900/30 p-2.5 rounded-2xl rounded-tr-sm shadow-sm">
                              <div className="flex items-center gap-2">
                                <span className="flex h-2 w-2 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                </span>
                                <span className="text-[10px] text-cyan-300 font-sans italic">Listening to voice...</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                </div>



            {/* Simulated Settings Panel */}
            {activeScreen === "settings" && (
              <div id="screen-settings" className="flex-1 flex flex-col bg-slate-950 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
                  <button onClick={() => setActiveScreen("home")} className="text-slate-400 hover:text-slate-200 transition">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Auroza Personalization</h3>
                </div>

                <div className="space-y-4">
                  {/* AI Identity Config */}
                  <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/80 space-y-3">
                    <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wide">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Profile Identity</span>
                    </h4>

                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Assistant Name</label>
                        <input 
                          type="text" 
                          value={config.name}
                          onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Assistant Name"
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Language</label>
                          <select 
                            value={config.language}
                            onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                          >
                            <option value="English">English</option>
                            <option value="Urdu">Urdu (اردو)</option>
                            <option value="Hindi">Hindi (हिंदी)</option>
                            <option value="Sindhi">Sindhi (سنڌي)</option>
                            <option value="Arabic">Arabic (العربية)</option>
                            <option value="Spanish">Spanish</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Vocal Voice</label>
                          <select 
                            value={config.voice}
                            onChange={(e) => setConfig(prev => ({ ...prev, voice: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                          >
                            <option value="Zephyr">Zephyr (Default)</option>
                            <option value="Nova">Nova</option>
                            <option value="Echo">Echo</option>
                            <option value="Alloy">Alloy</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Personality Style</label>
                        <select 
                          value={config.style}
                          onChange={(e) => setConfig(prev => ({ ...prev, style: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="Warm">Warm & Empathetic</option>
                          <option value="Professional">Professional & Precise</option>
                          <option value="Energetic">Energetic & Fun</option>
                          <option value="Casual">Casual & Relaxed</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Cognitive Memory Vault */}
                  <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/80 space-y-3">
                    <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wide">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      <span>Cognitive Memory Vault</span>
                    </h4>

                    {/* Memory List */}
                    <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                      {memory.length === 0 ? (
                        <p className="text-[10px] text-slate-500 font-sans italic text-center py-2">Memory database is currently empty.</p>
                      ) : (
                        memory.map((m, index) => (
                          <div key={index} className="flex items-center justify-between bg-slate-950/80 border border-slate-850 p-2 rounded-xl">
                            <p className="text-[10px] text-slate-300 font-sans leading-relaxed break-words flex-1 pr-2">{m}</p>
                            <button 
                              onClick={() => {
                                setMemory(prev => prev.filter((_, i) => i !== index));
                                addAutomationLog(`Memory fact deleted from vault.`, "completed");
                              }}
                              className="text-slate-500 hover:text-red-400 transition"
                              title="Delete memory block"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Custom Memory Input */}
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const memoryText = formData.get("new_memory")?.toString().trim();
                        if (memoryText) {
                          setMemory(prev => {
                            if (prev.includes(memoryText)) return prev;
                            return [...prev, memoryText];
                          });
                          e.currentTarget.reset();
                          addAutomationLog(`Manual memory fact inserted: "${memoryText}"`, "completed");
                        }
                      }}
                      className="flex gap-1.5 pt-1.5"
                    >
                      <input 
                        type="text" 
                        name="new_memory"
                        placeholder="Add new persistent memory fact..."
                        className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1 text-[10px] text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                        required
                      />
                      <button 
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2.5 rounded-xl text-[10px] transition"
                      >
                        Add
                      </button>
                    </form>
                  </div>

                  {/* Hard Reset State Block */}
                  <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/80 space-y-1">
                    <h4 className="text-xs font-sans font-bold text-slate-200">Reset System State</h4>
                    <p className="text-[10px] text-slate-500 pb-2">Wipe conversation timeline and cognitive memory banks completely.</p>
                    <button 
                      onClick={() => {
                        if (confirm("Are you sure you want to hard reset all configuration and chat memories?")) {
                          setMessages([]);
                          setMemory([]);
                          addAutomationLog("System and memory databases completely reset.", "completed");
                          alert("System reset completed.");
                        }
                      }}
                      className="w-full bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 text-red-300 font-bold py-2 rounded-xl text-xs transition"
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

            {/* Minimal Distraction-Free Bottom Voice Console */}
            <div className="flex flex-col items-center justify-center py-4 bg-slate-950/85 backdrop-blur-md border-t border-slate-900/40 relative z-30 space-y-3 px-4">
              
              {/* Single, Large 'Microphone' Button at the bottom center */}
              <div className="relative flex items-center justify-center">
                {/* Glowing and pulsating wave effect rings behind the Mic */}
                <div className={`absolute w-24 h-24 rounded-full bg-cyan-500/5 filter blur-lg transition-all duration-1000 ${isListening ? "scale-125 bg-pink-500/10" : "scale-100"}`}></div>
                
                {isListening && (
                  <>
                    <div className="absolute w-20 h-20 bg-cyan-500/20 rounded-full animate-ping pointer-events-none"></div>
                    <div className="absolute w-16 h-16 bg-indigo-500/15 rounded-full animate-pulse pointer-events-none"></div>
                  </>
                )}

                <button
                  id="phone-mic-trigger-btn"
                  type="button"
                  onClick={handleToggleMic}
                  className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 transform active:scale-95 shadow-2xl z-10 ${
                    isListening
                      ? "bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 scale-110 shadow-cyan-500/40 text-slate-950 font-extrabold"
                      : "bg-slate-900 border-2 border-slate-800 hover:border-slate-700 text-cyan-400 hover:text-cyan-300 hover:shadow-cyan-500/5"
                  }`}
                  title={isListening ? "Stop listening" : "Speak to Auroza"}
                >
                  <Mic className={`w-7 h-7 ${isListening ? "animate-pulse text-slate-950" : "text-cyan-400"}`} />
                </button>
              </div>
              
              {/* Feedback Sub-text displaying speaking/idle status in Urdu or English */}
              <div className="text-center h-4 flex items-center justify-center">
                <p className={`text-[10px] font-mono tracking-wide ${isListening ? "text-cyan-400 animate-pulse font-bold" : "text-slate-600"}`}>
                  {isListening 
                    ? (speechFeedback || "Listening... Speak now") 
                    : "TAP TO TALK"
                  }
                </p>
              </div>

            </div>
          </div>
          </>
          )}

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


    </div>
  );
}
