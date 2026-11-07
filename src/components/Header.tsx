import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  ChevronDown,
  Sparkles,
  Cpu,
  Zap,
  Globe,
  Sliders,
  Share2,
  Code2,
  PhoneCall,
  Check,
  Brain,
} from 'lucide-react';
import { ThinkingLevelOption } from '../types';

interface HeaderProps {
  currentModel: string;
  onSelectModel: (model: string) => void;
  thinkingLevel: ThinkingLevelOption;
  onChangeThinkingLevel: (level: ThinkingLevelOption) => void;
  useWebSearch: boolean;
  onToggleWebSearch: () => void;
  onToggleSidebar: () => void;
  onToggleCanvas: () => void;
  isCanvasOpen: boolean;
  onOpenVoiceCall: () => void;
  onShareChat: () => void;
  onOpenSettings: () => void;
}

const MODELS = [
  {
    id: 'gemini-3.1-flash-lite',
    name: 'VEXO Lightning',
    badge: '⚡ Instant (<200ms)',
    description: 'Zero-latency instant neural response engine with millisecond reply speed',
    icon: Zap,
    color: 'text-amber-400',
  },
  {
    id: 'gemini-3.8-flash',
    name: 'VEXO 3.8 Flash',
    badge: 'Multimodal',
    description: 'Advanced vision, document analysis, and balanced coding',
    icon: Sparkles,
    color: 'text-indigo-400',
  },
  {
    id: 'gemini-4-argon',
    name: 'VEXO 4 Argon Pro',
    badge: 'Deep STEM',
    description: 'Flagship deep STEM logic and massive system architecture',
    icon: Brain,
    color: 'text-purple-400',
  },
];

export const Header: React.FC<HeaderProps> = ({
  currentModel,
  onSelectModel,
  thinkingLevel,
  onChangeThinkingLevel,
  useWebSearch,
  onToggleWebSearch,
  onToggleSidebar,
  onToggleCanvas,
  isCanvasOpen,
  onOpenVoiceCall,
  onShareChat,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [thinkingDropdownOpen, setThinkingDropdownOpen] = useState(false);

  const modelRef = useRef<HTMLDivElement>(null);
  const thinkingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
      if (thinkingRef.current && !thinkingRef.current.contains(e.target as Node)) {
        setThinkingDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeModelObj = MODELS.find((m) => m.id === currentModel) || MODELS[0];
  const ActiveIcon = activeModelObj.icon;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-3 md:px-5 py-2.5 bg-[#0b0f17]/80 backdrop-blur-md border-b border-white/5">
      {/* Left: Mobile Toggle & Model Selector */}
      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 md:hidden"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Model Selector Dropdown */}
        <div className="relative" ref={modelRef}>
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs md:text-sm transition-all"
          >
            <ActiveIcon className={`w-4 h-4 ${activeModelObj.color}`} />
            <span>{activeModelObj.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {modelDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 p-1.5 rounded-2xl glass-dropdown z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-white/5">
                Select Intelligence Engine
              </div>
              <div className="mt-1 space-y-1">
                {MODELS.map((m) => {
                  const Icon = m.icon;
                  const isSelected = m.id === currentModel;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSelectModel(m.id);
                        setModelDropdownOpen(false);
                      }}
                      className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-colors ${
                        isSelected
                          ? 'bg-indigo-600/20 text-white border border-indigo-500/30'
                          : 'hover:bg-white/5 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${m.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-white">{m.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300 font-mono">
                            {m.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {m.description}
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Turbo Instant Speed Button */}
        <button
          onClick={() => {
            if (currentModel === 'gemini-3.1-flash-lite') {
              onSelectModel('gemini-3.8-flash');
              onChangeThinkingLevel('LOW');
            } else {
              onSelectModel('gemini-3.1-flash-lite');
              onChangeThinkingLevel('LOW');
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            currentModel === 'gemini-3.1-flash-lite' || thinkingLevel === 'LOW'
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/20'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
          title="Toggle Instant Millisecond Response Mode (No thinking delay)"
        >
          <Zap className={`w-3.5 h-3.5 ${currentModel === 'gemini-3.1-flash-lite' ? 'text-amber-400 fill-amber-400' : 'text-amber-400'}`} />
          <span>⚡ Fast (ms)</span>
        </button>

        {/* Thinking Level Selector */}
        <div className="relative hidden sm:block" ref={thinkingRef}>
          <button
            onClick={() => setThinkingDropdownOpen(!thinkingDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-slate-300 hover:text-white transition-all"
            title="Adjust reasoning & thinking depth"
          >
            <Brain className="w-3.5 h-3.5 text-indigo-400" />
            <span>Speed: <strong className="text-white capitalize">{thinkingLevel === 'LOW' ? 'Instant (ms)' : thinkingLevel.toLowerCase()}</strong></span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {thinkingDropdownOpen && (
            <div className="absolute left-0 mt-2 w-56 p-1.5 rounded-xl glass-dropdown z-50">
              {[
                { id: 'LOW', label: '⚡ Instant (< 300ms)', desc: 'Zero thinking delay, starts answering in milliseconds' },
                { id: 'MEDIUM', label: 'Balanced Reasoning', desc: 'Moderate thinking for general logic' },
                { id: 'HIGH', label: '🧠 Deep Thought', desc: 'Thorough reasoning for complex math/STEM' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onChangeThinkingLevel(item.id as ThinkingLevelOption);
                    setThinkingDropdownOpen(false);
                  }}
                  className={`w-full flex flex-col text-left p-2 rounded-lg text-xs transition-colors ${
                    thinkingLevel === item.id
                      ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                      : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{item.label}</span>
                    {thinkingLevel === item.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Web Search Grounding Toggle */}
        <button
          onClick={onToggleWebSearch}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
            useWebSearch
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-500/20'
              : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
          }`}
          title="Ground responses with real-time web search"
        >
          <Globe className={`w-3.5 h-3.5 ${useWebSearch ? 'text-cyan-400 animate-spin-slow' : ''}`} />
          <span className="hidden sm:inline">Web Search</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${useWebSearch ? 'bg-cyan-400' : 'bg-slate-600'}`}
          />
        </button>
      </div>

      {/* Right: Quick Features (Voice Call, Canvas, Share) */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Voice Call Mode Trigger */}
        <button
          onClick={onOpenVoiceCall}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs font-medium transition-all"
          title="Launch Live Voice Assistant"
        >
          <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Voice Call</span>
        </button>

        {/* Canvas Split-Screen Toggle */}
        <button
          onClick={onToggleCanvas}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
            isCanvasOpen
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
          title="Toggle Canvas Code & Document Sandbox"
        >
          <Code2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Canvas</span>
        </button>

        {/* Share / Export */}
        <button
          onClick={onShareChat}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-colors"
          title="Share conversation"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
