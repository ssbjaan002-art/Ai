import React, { useState, useEffect } from "react";
import { 
  Settings, 
  User, 
  Volume2, 
  Languages, 
  Brain, 
  ShieldCheck, 
  Cpu, 
  CheckCircle, 
  Plus, 
  Trash2, 
  AlertTriangle,
  Play,
  Sparkles,
  Download,
  Copy,
  Check,
  Layers,
  Sliders,
  Image as ImageIcon,
  Send,
  RefreshCw,
  Compass,
  Laptop
} from "lucide-react";
import { PermissionsState, AssistantConfig, AutomationStep } from "../types";

interface CompanionControlsProps {
  permissions: PermissionsState;
  setPermissions: React.Dispatch<React.SetStateAction<PermissionsState>>;
  config: AssistantConfig;
  setConfig: React.Dispatch<React.SetStateAction<AssistantConfig>>;
  memory: string[];
  setMemory: React.Dispatch<React.SetStateAction<string[]>>;
  automationLogs: AutomationStep[];
  isSandbox: boolean;
  onSimulateCommand: (cmd: string) => void;
  galleryImages: string[];
  setGalleryImages: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function CompanionControls({
  permissions,
  setPermissions,
  config,
  setConfig,
  memory,
  setMemory,
  automationLogs,
  isSandbox,
  onSimulateCommand,
  galleryImages,
  setGalleryImages
}: CompanionControlsProps) {
  const [newMemory, setNewMemory] = useState("");
  const [customCommand, setCustomCommand] = useState("");
  const [activeTab, setActiveTab] = useState<"assistant" | "studio">("assistant");

  // AI Studio Image Generation States
  const [studioPrompt, setStudioPrompt] = useState("A beautiful majestic king with a golden crown, deep wise expression, highly detailed digital painting, fine art style, warm light");
  const [negativePrompt, setNegativePrompt] = useState("blurry, low quality, distorted, extra limbs, bad proportions");
  const [selectedStyle, setSelectedStyle] = useState("Flux Ultra-Realistic");
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "4:3">("1:1");
  const [cfgScale, setCfgScale] = useState(7.5);
  const [samplingSteps, setSamplingSteps] = useState(28);
  const [useRandomSeed, setUseRandomSeed] = useState(true);
  const [customSeed, setCustomSeed] = useState("482938472");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [imageSentToPhone, setImageSentToPhone] = useState(false);

  const handleGenerateStudioImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studioPrompt.trim()) return;

    setIsGenerating(true);
    setGeneratedImageUrl("");
    setImageSentToPhone(false);
    
    const progressSteps = [
      { text: "⚡ Initializing local AI engine (CUDA backend)...", delay: 0 },
      { text: "💾 Checking system memory... VRAM Allocated: 11.2GB/16GB (Auroza-Flux-1.2)", delay: 500 },
      { text: "🧩 Parsing prompt embeddings via CLIP-L & T5 encoders...", delay: 1000 },
      { text: "⏳ Running Latent Diffusion Scheduler (Karras DPM++ 2M)...", delay: 1500 },
      { text: "🎨 Denoising latent space: 15% complete (Step 4/28)", delay: 2000 },
      { text: "🎨 Denoising latent space: 45% complete (Step 12/28)", delay: 2500 },
      { text: "🎨 Denoising latent space: 75% complete (Step 21/28)", delay: 3000 },
      { text: "🎨 Denoising latent space: 95% complete (Step 27/28)", delay: 3500 },
      { text: "⚙️ Reconstructing high-fidelity image via VAE decoder...", delay: 4000 }
    ];

    progressSteps.forEach(step => {
      setTimeout(() => {
        setGenerationProgress(step.text);
      }, step.delay);
    });

    setTimeout(() => {
      const styleModifier = 
        selectedStyle === "Flux Ultra-Realistic" ? ", photorealistic digital portrait, highly detailed, 8k resolution, volumetric lighting" :
        selectedStyle === "Cinematic Digital Matte" ? ", dramatic cinematic lighting, award winning digital concept art, masterpiece, rule of thirds" :
        selectedStyle === "Steampunk Blueprint" ? ", intricate steampunk mechanism blueprint style, golden ratio, vintage sketch paper, fine ink lines" :
        selectedStyle === "Neon Cyberpunk Core" ? ", highly detailed futuristic cyberpunk neon render, Unreal Engine 5, octane render, vivid colors" :
        selectedStyle === "Auroza Anime Edition" ? ", beautiful masterpiece anime key visual, studio ghibli and makoto shinkai aesthetic, vibrant anime style" : "";

      const sanitizedPrompt = encodeURIComponent(studioPrompt.trim() + styleModifier);
      const width = aspectRatio === "16:9" ? 1024 : aspectRatio === "9:16" ? 576 : aspectRatio === "4:3" ? 1024 : 768;
      const height = aspectRatio === "16:9" ? 576 : aspectRatio === "9:16" ? 1024 : aspectRatio === "4:3" ? 768 : 768;
      const seed = useRandomSeed ? Math.floor(Math.random() * 1000000000).toString() : customSeed;
      
      const url = `https://image.pollinations.ai/p/${sanitizedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
      
      setGeneratedImageUrl(url);
      setIsGenerating(false);
    }, 4500);
  };

  const handleSendToPhoneGallery = () => {
    if (!generatedImageUrl) return;
    setGalleryImages(prev => [generatedImageUrl, ...prev]);
    setImageSentToPhone(true);
    onSimulateCommand("open_gallery"); // Command simulated phone to jump to gallery screen!
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(studioPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCommand.trim()) return;
    onSimulateCommand(customCommand);
    setCustomCommand("");
  };

  const handleTogglePermission = (key: keyof PermissionsState) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemory.trim()) return;
    setMemory(prev => [...prev, newMemory.trim()]);
    setNewMemory("");
  };

  const handleDeleteMemory = (index: number) => {
    setMemory(prev => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div id="companion-controls-container" className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-100 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-sans font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
              Auroza AI Companion
            </h1>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5">Dual-Mode AI Control & Art Studio</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
            <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">Active</span>
          </div>
        </div>

        {/* High-Fidelity Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
          <button
            id="tab-btn-assistant"
            type="button"
            onClick={() => setActiveTab("assistant")}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === "assistant"
                ? "bg-slate-850 text-cyan-400 shadow-sm border border-slate-800"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Mobile Control</span>
          </button>
          <button
            id="tab-btn-studio"
            type="button"
            onClick={() => setActiveTab("studio")}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === "studio"
                ? "bg-slate-850 text-pink-400 shadow-sm border border-slate-800"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>PC AI Art Studio</span>
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5 flex-1">
        {activeTab === "assistant" ? (
          <>
            {/* Core Profile Personalization */}
            <section className="space-y-4 bg-slate-950/40 p-4 border border-slate-800/60 rounded-xl">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                <User className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-slate-300">AI Personalization</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Assistant Name</label>
                  <input 
                    id="assistant-name-input"
                    type="text" 
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Language Profile</label>
                  <select 
                    id="assistant-lang-select"
                    value={config.language}
                    onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <option value="English">English</option>
                    <option value="Urdu">Urdu (اردو)</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="Sindhi">Sindhi (سنڌي)</option>
                    <option value="Arabic">Arabic (العربية)</option>
                    <option value="Spanish">Spanish (Español)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">TTS Vocal Voice</label>
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-slate-400" />
                    <select 
                      id="assistant-voice-select"
                      value={config.voice}
                      onChange={(e) => setConfig(prev => ({ ...prev, voice: e.target.value }))}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    >
                      <option value="Zephyr">Zephyr (Warm & Professional)</option>
                      <option value="Fenrir">Fenrir (Deep & Bold)</option>
                      <option value="Kore">Kore (Friendly & Energetic)</option>
                      <option value="Puck">Puck (Cheerful & Playful)</option>
                      <option value="Charon">Charon (Calm & Reflective)</option>
                      <option value="Child">Child Voice Changer (Sweet & High Pitch)</option>
                      <option value="Girl">Girl Voice Changer (Sweet & Medium-High Pitch)</option>
                      <option value="YoungBoy">Young Boy Voice Changer (Playful & High Pitch)</option>
                      <option value="OldMan">Old Man Voice Changer (Raspy & Deep Pitch)</option>
                    </select>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">AI Personality Tone / Voice Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Warm", "Energetic", "Professional"].map((styleOpt) => (
                      <button
                        key={styleOpt}
                        type="button"
                        id={`style-btn-${styleOpt.toLowerCase()}`}
                        onClick={() => setConfig(prev => ({ ...prev, style: styleOpt }))}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                          config.style === styleOpt
                            ? "bg-gradient-to-r from-cyan-500 to-indigo-500 border-transparent text-slate-950 font-bold shadow-md shadow-cyan-500/10"
                            : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850"
                        }`}
                      >
                        {styleOpt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Dynamic Commands */}
            <section className="space-y-4 bg-slate-950/40 p-4 border border-slate-800/60 rounded-xl">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-slate-300">Simulator Direct Command</h2>
              </div>
              <form onSubmit={handleCommandSubmit} className="flex gap-2">
                <input 
                  id="custom-command-input"
                  type="text"
                  placeholder="e.g. 'Generate a image of a dragon' or 'Call Mom'"
                  value={customCommand}
                  onChange={(e) => setCustomCommand(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-slate-500"
                />
                <button 
                  id="run-command-btn"
                  type="submit"
                  className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-slate-900 font-bold px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Run</span>
                </button>
              </form>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] font-mono text-slate-400 self-center">Try:</span>
                {[
                  "Draw a picture of a magnificent king",
                  "Open gallery",
                  "Search amazon for smart watch",
                  "Play trailer on youtube"
                ].map((preset, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    onClick={() => onSimulateCommand(preset)}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded px-2 py-0.5 transition"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </section>

            {/* Device Permission Manager */}
            <section className="space-y-4 bg-slate-950/40 p-4 border border-slate-800/60 rounded-xl">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-slate-300">Android System Permissions</h2>
              </div>
              <p className="text-xs text-slate-400">
                Auroza adapts dynamically. If a permission is revoked, the assistant will decline action requests and ask for permission access.
              </p>
              <div className="space-y-2.5">
                {Object.keys(permissions).map((permKey) => {
                  const key = permKey as keyof PermissionsState;
                  return (
                    <div key={key} className="flex items-center justify-between py-1 px-2 hover:bg-slate-900/60 rounded-lg transition">
                      <span className="text-sm font-medium capitalize text-slate-300">{key} Permission</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          id={`permission-toggle-${key}`}
                          type="checkbox" 
                          checked={permissions[key]} 
                          onChange={() => handleTogglePermission(key)} 
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-slate-950"></div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Durable Memory Vault */}
            <section className="space-y-4 bg-slate-950/40 p-4 border border-slate-800/60 rounded-xl">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                <Brain className="w-4 h-4 text-pink-400" />
                <h2 className="text-sm font-semibold text-slate-300">Auroza's Cognitive Memory Vault</h2>
              </div>
              <p className="text-xs text-slate-400">
                Auroza automatically updates this vault when she learns something personal about you. You can also seed custom context.
              </p>
              <form onSubmit={handleAddMemory} className="flex gap-2">
                <input 
                  id="new-memory-input"
                  type="text"
                  placeholder="e.g. 'I am allergic to peanuts'"
                  value={newMemory}
                  onChange={(e) => setNewMemory(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/50 placeholder:text-slate-500"
                />
                <button 
                  id="add-memory-btn"
                  type="submit"
                  className="bg-pink-500/20 border border-pink-500/40 text-pink-300 hover:bg-pink-500/30 font-bold p-1.5 rounded-lg text-xs transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              <div className="max-h-[160px] overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                {memory.length === 0 ? (
                  <div className="text-center py-4 border border-dashed border-slate-800 rounded-lg text-xs text-slate-500">
                    Memory vault is empty. Try chat to let Auroza save memory!
                  </div>
                ) : (
                  memory.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-slate-900 border border-slate-800/60 rounded-md px-2.5 py-1.5">
                      <span className="text-slate-300">{item}</span>
                      <button 
                        id={`delete-memory-btn-${idx}`}
                        onClick={() => handleDeleteMemory(idx)}
                        className="text-slate-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

          </>
        ) : (
          /* =======================================================
             PC AI ART STUDIO VIEW (STABLE DIFFUSION/FOOOCUS LOCAL ENGINE)
             ======================================================= */
          <div className="space-y-4">
            <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <h2 className="text-sm font-bold text-slate-200">Local SDXL & Flux Creator Studio</h2>
              </div>
              
              <form onSubmit={handleGenerateStudioImage} className="space-y-4">
                {/* Visual Prompt Input */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider">Visual AI Prompt</label>
                    <button
                      type="button"
                      onClick={() => {
                        const prompts = [
                          "A majestic king in gold and red obsidian armor looking over his cybernetic cyberpunk kingdom, digital art, high fantasy, 8k resolution, photorealistic portrait",
                          "An ancient wizard-king holding an glowing blue plasma staff in front of a giant cosmic portal, photorealistic, intricate matte painting",
                          "A futuristic cybernetic king sitting on an illuminated motherboard circuit throne, glowing blue tracer lights, masterpiece, highly detailed render",
                          "Minimalist ink painting of a wise king with a golden wire crown, peaceful negative space, high-contrast fine art"
                        ];
                        const rand = prompts[Math.floor(Math.random() * prompts.length)];
                        setStudioPrompt(rand);
                      }}
                      className="text-[10px] text-pink-400 hover:text-pink-300 font-bold transition flex items-center gap-1"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Suggest Prompt</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    id="studio-prompt-textarea"
                    value={studioPrompt}
                    onChange={(e) => setStudioPrompt(e.target.value)}
                    placeholder="Describe what you want to generate in rich detail... e.g., 'A gorgeous photorealistic picture of a king in gold crown'"
                    className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-500 placeholder:text-slate-600 resize-none leading-relaxed"
                  />
                </div>

                {/* Preset Art Style */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Aesthetic Art Style Preset</label>
                  <select
                    id="studio-style-select"
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-500"
                  >
                    <option value="Flux Ultra-Realistic">Flux Ultra-Realistic (Photorealistic & High Detail)</option>
                    <option value="Cinematic Digital Matte">Cinematic Digital Matte (Epic Scene & Volumetric Lighting)</option>
                    <option value="Steampunk Blueprint">Steampunk Blueprint (Technical Retro Sketch)</option>
                    <option value="Neon Cyberpunk Core">Neon Cyberpunk Core (Vivid Glow & Octane Render)</option>
                    <option value="Auroza Anime Edition">Auroza Anime Edition (Studio Ghibli & Shinkai Aesthetic)</option>
                  </select>
                </div>

                {/* Aspect Ratio Selector */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Canvas Aspect Ratio</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {([
                      { id: "1:1", label: "Square", icon: "▢" },
                      { id: "16:9", label: "Cinema", icon: "▭" },
                      { id: "9:16", label: "Reels", icon: "▮" },
                      { id: "4:3", label: "Card", icon: "▱" }
                    ] as const).map((ratio) => (
                      <button
                        key={ratio.id}
                        type="button"
                        id={`ratio-btn-${ratio.id.replace(":", "-")}`}
                        onClick={() => setAspectRatio(ratio.id)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold border flex flex-col items-center justify-center gap-0.5 transition ${
                          aspectRatio === ratio.id
                            ? "bg-gradient-to-r from-pink-500 to-rose-500 border-transparent text-slate-950 font-bold"
                            : "bg-slate-900 border-slate-850 text-slate-400 hover:bg-slate-850"
                        }`}
                      >
                        <span className="text-[13px]">{ratio.icon}</span>
                        <span className="text-[9px]">{ratio.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced Sliders */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-3.5">
                  <div className="flex items-center gap-1.5 border-b border-slate-900 pb-1">
                    <Sliders className="w-3 h-3 text-pink-400" />
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Latent AI Parameters</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-1">
                      <span className="text-slate-400">CFG Scale (Guidance)</span>
                      <span className="text-pink-400 font-bold">{cfgScale}</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="20.0"
                      step="0.5"
                      value={cfgScale}
                      onChange={(e) => setCfgScale(parseFloat(e.target.value))}
                      className="w-full accent-pink-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-1">
                      <span className="text-slate-400">Sampling Steps (Inference)</span>
                      <span className="text-pink-400 font-bold">{samplingSteps}</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      step="1"
                      value={samplingSteps}
                      onChange={(e) => setSamplingSteps(parseInt(e.target.value))}
                      className="w-full accent-pink-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[10px] font-mono mb-1.5">
                      <span className="text-slate-400">Generation Seed</span>
                      <button
                        type="button"
                        onClick={() => setUseRandomSeed(!useRandomSeed)}
                        className={`px-1.5 py-0.5 rounded text-[9px] ${
                          useRandomSeed ? "bg-pink-500/10 text-pink-400 border border-pink-500/20" : "bg-slate-900 text-slate-500"
                        }`}
                      >
                        {useRandomSeed ? "🎲 Auto-Random" : "🔒 Fixed"}
                      </button>
                    </div>
                    {!useRandomSeed && (
                      <input
                        type="text"
                        value={customSeed}
                        onChange={(e) => setCustomSeed(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 rounded p-1.5 text-xs text-slate-300 font-mono focus:outline-none"
                      />
                    )}
                  </div>
                </div>

                {/* Negative Prompt */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">Negative Prompts (Remove elements)</label>
                  <input
                    type="text"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="e.g. blurry, extra hands..."
                    className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                </div>

                {/* Generate Trigger */}
                <button
                  type="submit"
                  id="btn-generate-masterpiece"
                  disabled={isGenerating}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold text-slate-950 flex items-center justify-center gap-2 transition transform active:scale-[0.98] ${
                    isGenerating
                      ? "bg-slate-850 border border-slate-800 text-pink-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-pink-500 via-rose-400 to-indigo-500 hover:brightness-110 shadow-lg shadow-pink-500/15"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Denoising Latents...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate PC Masterpiece</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* LIVE CONSOLE LOGS & OUTPUT TARGET */}
            {isGenerating && (
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-850 font-mono text-[10px] space-y-1.5 text-slate-400 shadow-inner">
                <div className="flex items-center justify-between text-[9px] border-b border-slate-900 pb-1 text-pink-500/70 uppercase">
                  <span>Auroza Neural Pipeline Log</span>
                  <span className="animate-pulse">Active Engine...</span>
                </div>
                <div className="text-slate-300">{generationProgress}</div>
                <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden mt-1.5">
                  <div className="bg-gradient-to-r from-pink-500 to-indigo-500 h-1 rounded-full animate-progress" style={{ width: "85%" }}></div>
                </div>
              </div>
            )}

            {/* GENERATION OUTPUT RESULT */}
            {generatedImageUrl && !isGenerating && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-[11px] font-mono font-bold text-pink-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Masterpiece Complete</span>
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">Seed: {useRandomSeed ? "Auto" : customSeed}</span>
                </div>

                <div className="aspect-square relative rounded-lg overflow-hidden border border-slate-850 bg-slate-900 flex items-center justify-center">
                  <img
                    src={generatedImageUrl}
                    alt="AI Masterpiece Output"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="py-1.5 px-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 transition"
                  >
                    {copiedPrompt ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                  <a
                    href={generatedImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1.5 px-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 transition text-center"
                  >
                    <Download className="w-3 h-3" />
                    <span>Save PC</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleSendToPhoneGallery}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition border ${
                      imageSentToPhone
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-pink-500/20 text-pink-300 hover:bg-pink-500/20"
                    }`}
                  >
                    <Send className="w-3 h-3" />
                    <span>{imageSentToPhone ? "Sent to Phone!" : "Send to Phone"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5">
          <CheckCircle className={`w-3.5 h-3.5 ${isSandbox ? "text-amber-400" : "text-emerald-400"}`} />
          <span className="text-[11px] font-mono text-slate-300">
            {isSandbox ? "Sandbox Mode (No API Key)" : "Gemini 3.5 Engine Engaged"}
          </span>
        </div>
        <p className="text-[10px] text-slate-500">
          API keys are secured via Settings &gt; Secrets.
        </p>
      </div>
    </div>
  );
}
