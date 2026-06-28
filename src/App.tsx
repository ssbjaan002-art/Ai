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
  const [messages, setMessages] = useState<Message[]>([]);
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
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      
      {/* Sidebar Controls Column */}
      <div className="w-full lg:w-[400px] xl:w-[440px] flex-shrink-0 h-[45vh] lg:h-full border-b lg:border-b-0 lg:border-r border-slate-800">
        <CompanionControls 
          permissions={permissions}
          setPermissions={setPermissions}
          config={config}
          setConfig={setConfig}
          memory={memory}
          setMemory={setMemory}
          automationLogs={automationLogs}
          isSandbox={isSandbox}
          onSimulateCommand={handleSimulateCommand}
          galleryImages={galleryImages}
          setGalleryImages={setGalleryImages}
        />
      </div>

      {/* Main Sandbox Workspace & Simulator Column */}
      <div className="flex-1 flex flex-col h-[55vh] lg:h-full relative bg-slate-950">
        
        {/* Dynamic Context Header */}
        <header className="px-6 py-4 border-b border-slate-900 bg-slate-950/40 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold text-slate-200">Auroza Virtual Screen Space</h2>
              <p className="text-[11px] text-slate-400 font-mono">Interact directly with the Material Design 3 display</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Durable Local Logs</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Volume2 className="w-3.5 h-3.5 text-pink-400" />
              <span>Auto TTS Synth</span>
            </div>
          </div>
        </header>

        {/* Simulator Frame */}
        <div className="flex-1 overflow-hidden">
          <VirtualPhone 
            permissions={permissions}
            config={config}
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
        <footer className="px-6 py-3 border-t border-slate-900 bg-slate-950/40 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Click the virtual app shortcuts or type questions inside the chat.</span>
          </div>
          <span className="hidden md:inline font-mono">Auroza Core 1.0 (Google AI Studio Build)</span>
        </footer>

      </div>

    </div>
  );
}
