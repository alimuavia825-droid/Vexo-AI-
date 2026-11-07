import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  X,
  User,
  Sliders,
  Sparkles,
  Volume2,
  Database,
  Activity,
  Download,
  Upload,
  Trash2,
  Check,
  Moon,
  Sun,
  Shield,
  Palette,
  Brain,
} from 'lucide-react';
import { AppSettings, ChatSession } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  sessions: ChatSession[];
  onClearAllChats: () => void;
  onImportSessions: (sessions: ChatSession[]) => void;
}

type SettingsSection = 'general' | 'personalization' | 'model' | 'voice' | 'data' | 'diagnostics';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  sessions,
  onClearAllChats,
  onImportSessions,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [saveToast, setSaveToast] = useState(false);
  const [diagStatus, setDiagStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdate = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    onSaveSettings(updated);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 1500);
  };

  const handleExportData = () => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: formData,
      sessions,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vexo-ai-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.sessions)) {
          onImportSessions(parsed.sessions);
          if (parsed.settings) {
            handleUpdate('systemPersona', parsed.settings.systemPersona || formData.systemPersona);
          }
          alert(`Successfully restored ${parsed.sessions.length} conversations!`);
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  const runDiagnostics = async () => {
    setDiagStatus('Testing connection to VEXO-AI neural core...');
    try {
      const startTime = performance.now();
      const res = await fetch('/api/health');
      const data = await res.json();
      const latency = Math.round(performance.now() - startTime);

      if (res.ok) {
        setDiagStatus(
          `Healthy! Latency: ${latency}ms • Status: ${data.status} • Neural Core Engine: ${
            data.hasApiKey ? 'Active (Ready)' : 'Standby'
          }`
        );
      } else {
        setDiagStatus(`Server returned error: ${res.statusText}`);
      }
    } catch (e: any) {
      setDiagStatus(`Diagnostic connection failed: ${e?.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] rounded-3xl bg-[#0d121d] border border-white/10 shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Left Navigation Sidebar */}
        <div className="w-full md:w-56 p-4 bg-[#080c14] border-b md:border-b-0 md:border-r border-white/5 space-y-1">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-3">
            <SettingsIcon className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-sm text-white">Settings</span>
          </div>

          {[
            { id: 'general', label: 'General', icon: Sliders },
            { id: 'personalization', label: 'Personalization', icon: User },
            { id: 'model', label: 'Model & Logic', icon: Brain },
            { id: 'voice', label: 'Voice & Audio', icon: Volume2 },
            { id: 'data', label: 'Data Management', icon: Database },
            { id: 'diagnostics', label: 'Diagnostics', icon: Activity },
          ].map((tab: any) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0e1420]">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#0b0f17]">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white capitalize">{activeSection} Settings</h2>
              {saveToast && (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                  <Check className="w-3 h-3" /> Saved
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
            {/* General Section */}
            {activeSection === 'general' && (
              <div className="space-y-6">
                <div>
                  <label className="font-semibold text-white block mb-2">Theme Aesthetic</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'dark', label: 'Dark Deep' },
                      { id: 'midnight', label: 'Midnight Slate' },
                      { id: 'cyber', label: 'OLED Cyber' },
                      { id: 'light', label: 'Clean Contrast' },
                    ].map((th) => (
                      <button
                        key={th.id}
                        onClick={() => handleUpdate('theme', th.id as any)}
                        className={`p-3 rounded-xl border text-left font-medium ${
                          formData.theme === th.id
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {th.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
                  <div>
                    <span className="font-semibold text-white block">Interface Sound Effects</span>
                    <span className="text-slate-400 text-[11px]">
                      Play subtle audio chimes when sending and receiving messages
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.soundEffects}
                    onChange={(e) => handleUpdate('soundEffects', e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
                  <div>
                    <span className="font-semibold text-white block">Real-Time Web Search</span>
                    <span className="text-slate-400 text-[11px]">
                      Default search grounding enabled for live facts, current events, and news
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enableWebSearch}
                    onChange={(e) => handleUpdate('enableWebSearch', e.target.checked)}
                    className="w-4 h-4 accent-cyan-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Personalization Section */}
            {activeSection === 'personalization' && (
              <div className="space-y-5">
                <div>
                  <label className="font-semibold text-white block mb-1">AI Persona & System Prompt</label>
                  <p className="text-slate-400 text-[11px] mb-2">
                    Defines the foundational instructions and personality of VEXO-AI.
                  </p>
                  <textarea
                    rows={3}
                    value={formData.systemPersona}
                    onChange={(e) => handleUpdate('systemPersona', e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 outline-none focus:border-indigo-500/50 resize-none font-mono text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="font-semibold text-white block mb-1">
                    What should VEXO-AI know about you?
                  </label>
                  <p className="text-slate-400 text-[11px] mb-2">
                    Share your role, coding stack, preferred frameworks, or goals.
                  </p>
                  <textarea
                    rows={3}
                    value={formData.userInstructions}
                    onChange={(e) => handleUpdate('userInstructions', e.target.value)}
                    placeholder="e.g. I am a senior full-stack developer who prefers TypeScript, Tailwind CSS, clean architecture, and minimal fluff."
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 outline-none focus:border-indigo-500/50 resize-none text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="font-semibold text-white block mb-2">Response Tone & Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'balanced', label: 'Balanced & Natural' },
                      { id: 'concise', label: 'Concise & Direct' },
                      { id: 'detailed', label: 'Deep & Step-by-Step' },
                      { id: 'code-first', label: 'Code-First & Technical' },
                    ].map((tone) => (
                      <button
                        key={tone.id}
                        onClick={() => handleUpdate('responseTone', tone.id as any)}
                        className={`p-2.5 rounded-xl border text-left font-medium ${
                          formData.responseTone === tone.id
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {tone.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Model & Logic Section */}
            {activeSection === 'model' && (
              <div className="space-y-5">
                <div>
                  <label className="font-semibold text-white block mb-1">Default Model</label>
                  <select
                    value={formData.defaultModel}
                    onChange={(e) => handleUpdate('defaultModel', e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 outline-none"
                  >
                    <option value="gemini-3.1-flash-lite">VEXO Lightning Instant (&lt; 200ms)</option>
                    <option value="gemini-3.8-flash">VEXO 3.8 Flash (Multimodal &amp; Coding)</option>
                    <option value="gemini-4-argon">VEXO 4 Argon Pro (Deep STEM Logic)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-white block mb-1">Reasoning & Response Speed</label>
                  <p className="text-slate-400 text-[11px] mb-2">
                    Controls the depth of internal thinking steps. Set to <strong>Instant</strong> for millisecond answers without thinking pauses.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'LOW', label: '⚡ Instant (ms)', sub: '< 300ms' },
                      { id: 'MEDIUM', label: 'Balanced', sub: 'Moderate' },
                      { id: 'HIGH', label: 'Deep Logic', sub: 'Thorough' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleUpdate('thinkingLevel', item.id as any)}
                        className={`p-2.5 rounded-xl border font-medium text-center transition-all ${
                          formData.thinkingLevel === item.id
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs">{item.label}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Voice & Audio Section */}
            {activeSection === 'voice' && (
              <div className="space-y-5">
                <div>
                  <label className="font-semibold text-white block mb-1">Default Voice Persona</label>
                  <select
                    value={formData.voiceSettings.voiceName}
                    onChange={(e) =>
                      handleUpdate('voiceSettings', {
                        ...formData.voiceSettings,
                        voiceName: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 outline-none"
                  >
                    <option value="Kore">Kore (Warm, articulate feminine)</option>
                    <option value="Puck">Puck (Energetic, crisp masculine)</option>
                    <option value="Charon">Charon (Deep, resonant masculine)</option>
                    <option value="Fenrir">Fenrir (Bold, cinematic masculine)</option>
                    <option value="Zephyr">Zephyr (Calm, soothing feminine)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
                  <div>
                    <span className="font-semibold text-white block">Auto-play Voice on Message</span>
                    <span className="text-slate-400 text-[11px]">
                      Automatically read incoming replies out loud
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.voiceSettings.autoPlayVoice}
                    onChange={(e) =>
                      handleUpdate('voiceSettings', {
                        ...formData.voiceSettings,
                        autoPlayVoice: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-cyan-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Data Management Section */}
            {activeSection === 'data' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">Export Conversations</span>
                      <span className="text-slate-400 text-[11px]">
                        Download complete backup of {sessions.length} chats as JSON
                      </span>
                    </div>
                    <button
                      onClick={handleExportData}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export JSON</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">Import Conversations</span>
                      <span className="text-slate-400 text-[11px]">
                        Restore previous chats from a backup file
                      </span>
                    </div>
                    <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import JSON</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-rose-300 block">Delete All Conversations</span>
                      <span className="text-rose-400/80 text-[11px]">
                        Irreversible. Wipes local chat history.
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete all conversations? This cannot be undone.')) {
                          onClearAllChats();
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Diagnostics Section */}
            {activeSection === 'diagnostics' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white">System Diagnostics & Engine Status</h3>
                  <p className="text-slate-400 text-[11px] mt-1">
                    Check backend connection, neural core initialization, and real-time response speed.
                  </p>
                </div>

                <button
                  onClick={runDiagnostics}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                >
                  Run Diagnostic Check
                </button>

                {diagStatus && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {diagStatus}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
