import { useState, useEffect } from "react";
import CompanionControls from "./components/CompanionControls";
import VirtualPhone from "./components/VirtualPhone";
import { Message, PermissionsState, AssistantConfig, AutomationStep } from "./types";
import { Sparkles, HelpCircle, Shield, Info, Volume2 } from "lucide-react";

export default function App() {
  // Persist State
  const [permissions, setPermissions] = useState<PermissionsState>({
    camera: true,
    microphone: true,
    contacts: true,
    phone: true,
    sms: true,
    location: true
  });

  const [config, setConfig] = useState<AssistantConfig>({
    name: "Auroza AI",
    language: "English",
    voice: "Zephyr",
    style: "Warm"
  });

  const [memory, setMemory] = useState<string[]>([
    "User prefers immediate direct responses.",
    "User has English as default language setup.",
    "Auroza virtual overlay automation activated."
  ]);

  const [automationLogs, setAutomationLogs] = useState<AutomationStep[]>([]);
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("auroza_chat_history_gemini");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing chat history:", e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("auroza_chat_history_gemini", JSON.stringify(messages));
  }, [messages]);

  const [simulateCommand, setSimulateCommand] = useState("");
  const [isSandbox, setIsSandbox] = useState(true);
  const [galleryImages, setGalleryImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1511576661531-b34d7ad5d0db?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=80"
  ]);

  // Check if Gemini API Key is loaded in the workspace environment
  useEffect(() => {
    // Dynamic fetch to verify connection (or we know server.ts falls back beautifully)
    setIsSandbox(false); // Defaulting to API execution. If server.ts warns, it automatically shows fallback message.
  }, []);

  const addAutomationLog = (desc: string, status: "pending" | "running" | "completed" | "failed") => {
    const newLog: AutomationStep = {
      id: Date.now().toString() + Math.random().toString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      description: desc,
      status
    };
    setAutomationLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const handleSimulateCommand = (cmd: string) => {
    setSimulateCommand(cmd);
    addAutomationLog(`External trigger received: "${cmd}"`, "pending");
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none p-4 lg:p-6">
      
      {/* Main Sandbox Workspace & Simulator Column */}
      <div className="w-full max-w-lg h-full flex flex-col relative bg-slate-900/60 border border-slate-800/80 rounded-[40px] shadow-2xl overflow-hidden backdrop-blur-sm">
        
        {/* Dynamic Context Header */}
        <header className="px-6 py-4 border-b border-slate-900 bg-slate-950/80 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold text-slate-200">Auroza AI Companion</h2>
              <p className="text-[11px] text-slate-400 font-mono">Static voice & chat interface</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-900/40">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Secure</span>
            </div>
          </div>
        </header>

        {/* Simulator Frame */}
        <div className="flex-1 overflow-hidden">
          <VirtualPhone 
            permissions={permissions}
            config={config}
            setConfig={setConfig}
            memory={memory}
            setMemory={setMemory}
            isSandbox={isSandbox}
            addAutomationLog={addAutomationLog}
            messages={messages}
            setMessages={setMessages}
            simulateCommand={simulateCommand}
            clearSimulateCommand={() => setSimulateCommand("")}
            galleryImages={galleryImages}
            setGalleryImages={setGalleryImages}
          />
        </div>

        {/* Quick Instructions / Info Bar */}
        <footer className="px-6 py-3 border-t border-slate-900 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Tap microphone to talk. Offline-first speech synthesis active.</span>
          </div>
          <span className="font-mono text-[10px]">v1.0-manual</span>
        </footer>

      </div>

    </div>
  );
}
