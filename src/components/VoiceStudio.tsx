import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Download,
  Volume2,
  Sparkles,
  RefreshCw,
  PhoneCall,
  PhoneOff,
  Radio,
  FileAudio,
  Trash2,
  Send,
  Upload,
} from 'lucide-react';
import { VoiceStudioItem } from '../types';
import { fileToBase64, LiveSpeechRecognizer, speakTextBrowser } from '../utils/audio';

interface VoiceStudioProps {
  items: VoiceStudioItem[];
  onAddItem: (item: VoiceStudioItem) => void;
  onDeleteItem: (id: string) => void;
  onSendToChat: (text: string) => void;
}

const VOICES = [
  { id: 'Kore', name: 'Kore', gender: 'Feminine', vibe: 'Warm, articulate, natural', tag: 'Recommended' },
  { id: 'Puck', name: 'Puck', gender: 'Masculine', vibe: 'Energetic, crisp, enthusiastic', tag: 'Podcast' },
  { id: 'Charon', name: 'Charon', gender: 'Masculine', vibe: 'Deep, resonant, authoritative', tag: 'Narration' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'Masculine', vibe: 'Bold, cinematic, dramatic', tag: 'Audiobook' },
  { id: 'Zephyr', name: 'Zephyr', gender: 'Feminine', vibe: 'Calm, soothing, meditative', tag: 'Meditation' },
];

const PRESET_SCRIPTS = [
  {
    title: 'Podcast Intro',
    text: 'Welcome back to the Future Tech broadcast. Today we are exploring the frontiers of artificial intelligence, multimodal agents, and how intelligence is reshaping human creativity.',
    style: 'Enthusiastic and professional podcast host',
  },
  {
    title: 'Product Launch Keynote',
    text: 'We are thrilled to introduce VEXO-AI. Designed from the ground up for speed, depth, and seamless voice conversation. Everything you need is now at your fingertips.',
    style: 'Confident, inspiring tech leader',
  },
  {
    title: 'Mindfulness Meditation',
    text: 'Take a gentle, deep breath in... hold for a moment... and exhale slowly. Let your shoulders soften and allow your mind to arrive fully in this present moment.',
    style: 'Calm, soothing, slow meditation guide',
  },
];

export const VoiceStudio: React.FC<VoiceStudioProps> = ({
  items,
  onAddItem,
  onDeleteItem,
  onSendToChat,
}) => {
  const [activeTab, setActiveTab] = useState<'tts' | 'live-call' | 'transcribe'>('tts');

  // TTS State
  const [script, setScript] = useState(PRESET_SCRIPTS[0].text);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [voiceStyle, setVoiceStyle] = useState(PRESET_SCRIPTS[0].style);
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live Call Mode State
  const [isCallActive, setIsCallActive] = useState(false);
  const [callTranscript, setCallTranscript] = useState<string[]>([]);
  const [callStatus, setCallStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');

  // Transcribe State
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [transcribeFile, setTranscribeFile] = useState<File | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognizerRef = useRef<LiveSpeechRecognizer | null>(null);
  const callSpeechCancelRef = useRef<(() => void) | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      recognizerRef.current?.stop();
      callSpeechCancelRef.current?.();
    };
  }, []);

  // Handle TTS Generation
  const handleGenerateTTS = async () => {
    if (!script.trim()) return;
    setIsGeneratingTTS(true);
    setError(null);

    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: script.trim(),
          voiceName: selectedVoice,
          style: voiceStyle,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to synthesize speech');
      }

      if (data.audioUrl) {
        const newItem: VoiceStudioItem = {
          id: `${Date.now()}-${Math.random()}`,
          text: script.trim(),
          voiceName: selectedVoice,
          audioUrl: data.audioUrl,
          createdAt: Date.now(),
          style: voiceStyle,
        };

        onAddItem(newItem);
        playAudio(data.audioUrl);
      }
    } catch (e: any) {
      console.warn('TTS API fallback to local speech engine:', e);
      // Fallback to browser speech synthesis
      speakTextBrowser(script.trim(), 1.0, () => {
        setIsGeneratingTTS(false);
      });
      setError('Audio synthesized via local high-speed speech engine.');
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  const playAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingAudioUrl(url);

    audio.onended = () => {
      setPlayingAudioUrl(null);
    };
    audio.onerror = () => {
      setPlayingAudioUrl(null);
    };
    audio.play();
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingAudioUrl(null);
    }
  };

  // Start Live Voice Call
  const startLiveCall = () => {
    setIsCallActive(true);
    setCallStatus('listening');
    setCallTranscript(['VEXO Voice Agent connected. Say anything to start!']);

    recognizerRef.current = new LiveSpeechRecognizer(
      async (userSaid, isFinal) => {
        if (!isFinal || !userSaid.trim()) return;

        setCallTranscript((prev) => [...prev, `You: ${userSaid}`]);
        setCallStatus('thinking');

        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content:
                    'You are in a live real-time voice call with the user. Keep your responses short, conversational, natural, and under 2-3 sentences so it feels like a real voice phone conversation.',
                },
                {
                  role: 'user',
                  content: userSaid,
                },
              ],
            }),
          });

          const data = await res.json();
          const reply = data.text || 'I hear you. Tell me more!';
          setCallTranscript((prev) => [...prev, `VEXO: ${reply}`]);
          setCallStatus('speaking');

          // Speak back reply
          callSpeechCancelRef.current = speakTextBrowser(reply, 1.05, () => {
            setCallStatus('listening');
          });
        } catch (e) {
          setCallStatus('listening');
        }
      },
      (err) => {
        console.warn('Call voice error:', err);
      },
      () => {
        if (isCallActive) {
          try {
            recognizerRef.current?.start();
          } catch (e) {}
        }
      }
    );

    recognizerRef.current.start();
  };

  const endLiveCall = () => {
    setIsCallActive(false);
    setCallStatus('idle');
    recognizerRef.current?.stop();
    callSpeechCancelRef.current?.();
  };

  // Audio Transcribe
  const handleTranscribe = async () => {
    if (!transcribeFile) return;
    setIsTranscribing(true);
    setError(null);

    try {
      const base64 = await fileToBase64(transcribeFile);
      const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Audio: base64,
          mimeType: transcribeFile.type || 'audio/webm',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to transcribe audio');
      setTranscribedText(data.transcript || 'No speech detected in audio file.');
    } catch (e: any) {
      console.error('Transcription error:', e);
      setError(e?.message || 'Failed to transcribe audio file.');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-6xl mx-auto space-y-8">
      {/* Voice Studio Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-[#121824] border border-cyan-500/20 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Radio className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              VEXO Voice Studio
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              High-fidelity speech synthesis, live voice assistant, and neural audio transcription
            </p>
          </div>
        </div>

        {/* Studio Sub-Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-black/40 border border-white/10 text-xs font-medium">
          <button
            onClick={() => setActiveTab('tts')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'tts'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Speech Synthesis
          </button>
          <button
            onClick={() => setActiveTab('live-call')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'live-call'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Live Voice Call
          </button>
          <button
            onClick={() => setActiveTab('transcribe')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'transcribe'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Audio Transcribe
          </button>
        </div>
      </div>

      {/* Tab 1: Text to Speech (TTS) */}
      {activeTab === 'tts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            {/* Script Input */}
            <div className="p-5 rounded-2xl bg-[#121824] border border-white/10 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Script to Voice
                </label>
                <span className="text-[11px] text-slate-500 font-mono">{script.length} / 1200 chars</span>
              </div>

              <textarea
                rows={4}
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Type or paste the words you want VEXO to speak..."
                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500/50 resize-none leading-relaxed"
              />

              {/* Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-500">Preset Scripts:</span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_SCRIPTS.map((ps, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setScript(ps.text);
                        setVoiceStyle(ps.style);
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white transition-colors"
                    >
                      {ps.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Voice Persona Selector */}
            <div className="p-5 rounded-2xl bg-[#121824] border border-white/10 space-y-3 shadow-xl">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Select Voice Persona
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {VOICES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVoice(v.id)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      selectedVoice === v.id
                        ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-md shadow-cyan-500/20'
                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-cyan-400" />
                        <span className="font-semibold text-xs text-white">{v.name}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                        {v.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{v.vibe}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Style / Emotion Input */}
            <div className="p-5 rounded-2xl bg-[#121824] border border-white/10 space-y-2 shadow-xl">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Voice Tone & Style Prompt
              </label>
              <input
                type="text"
                value={voiceStyle}
                onChange={(e) => setVoiceStyle(e.target.value)}
                placeholder="e.g. Enthusiastic podcast host, Whispering secretively, Calm documentary narrator..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Generate TTS Button */}
            <button
              onClick={handleGenerateTTS}
              disabled={isGeneratingTTS || !script.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-cyan-500 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-cyan-600/30 transition-all disabled:opacity-50 active:scale-[0.99]"
            >
              {isGeneratingTTS ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Voice Audio...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Spoken Audio</span>
                </>
              )}
            </button>

            {error && (
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 text-xs">
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Audio History & Visualizer */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-[#121824] border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Audio Library ({items.length})
                </span>
              </div>

              {items.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <FileAudio className="w-10 h-10 mx-auto mb-2 opacity-30 text-cyan-400" />
                  <p className="text-xs">No audio generated yet. Write a script and generate speech!</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {items.map((item) => {
                    const isThisPlaying = playingAudioUrl === item.audioUrl;
                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isThisPlaying
                            ? 'bg-cyan-500/15 border-cyan-500/40 text-white'
                            : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => (isThisPlaying ? stopAudio() : playAudio(item.audioUrl))}
                              className="p-2 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors shadow"
                            >
                              {isThisPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                            </button>
                            <div>
                              <span className="font-semibold text-xs text-white">{item.voiceName}</span>
                              <p className="text-[10px] text-slate-400">
                                {new Date(item.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <a
                              href={item.audioUrl}
                              download={`vexo-voice-${Date.now()}.wav`}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                              title="Download WAV"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => onDeleteItem(item.id)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {item.text}
                        </p>

                        {/* Animated waveform bars while playing */}
                        {isThisPlaying && (
                          <div className="flex items-center gap-1 mt-3 h-5">
                            {[12, 24, 16, 28, 20, 14, 26, 18, 30, 22, 10, 24].map((h, i) => (
                              <div
                                key={i}
                                className="w-1 bg-cyan-400 rounded-full animate-pulse"
                                style={{
                                  height: `${h}px`,
                                  animationDelay: `${i * 0.1}s`,
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Live Voice Call Mode */}
      {activeTab === 'live-call' && (
        <div className="p-8 md:p-12 rounded-3xl bg-[#0f1420] border border-cyan-500/30 text-center space-y-8 max-w-3xl mx-auto shadow-2xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Interactive Voice Call Mode
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-md mx-auto">
              Real-time conversational voice experience. Speak naturally and VEXO-AI will respond instantly.
            </p>
          </div>

          {/* Animated Glowing Voice Orb */}
          <div className="relative py-8">
            <div
              className={`w-40 h-40 md:w-48 md:h-48 mx-auto rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
                isCallActive
                  ? callStatus === 'speaking'
                    ? 'bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-500 animate-voice-pulse shadow-cyan-500/50 scale-105'
                    : callStatus === 'thinking'
                    ? 'bg-gradient-to-tr from-purple-500 to-indigo-600 animate-spin-slow shadow-purple-500/40'
                    : 'bg-gradient-to-tr from-cyan-600 to-indigo-700 shadow-cyan-600/40 animate-pulse'
                  : 'bg-gradient-to-tr from-slate-800 to-slate-900 border border-white/10 opacity-70'
              }`}
            >
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-[#0b0f17]/90 flex items-center justify-center">
                {isCallActive ? (
                  callStatus === 'speaking' ? (
                    <Volume2 className="w-10 h-10 text-cyan-300 animate-bounce" />
                  ) : callStatus === 'thinking' ? (
                    <Sparkles className="w-10 h-10 text-purple-300 animate-spin" />
                  ) : (
                    <Mic className="w-10 h-10 text-cyan-400 animate-pulse" />
                  )
                ) : (
                  <MicOff className="w-10 h-10 text-slate-600" />
                )}
              </div>
            </div>

            {/* Status Indicator */}
            <div className="mt-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono capitalize text-slate-300">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isCallActive ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'
                  }`}
                />
                Status: {isCallActive ? callStatus : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Call Controls */}
          <div>
            {!isCallActive ? (
              <button
                onClick={startLiveCall}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/30 transition-all active:scale-95"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Start Voice Call</span>
              </button>
            ) : (
              <button
                onClick={endLiveCall}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 transition-all active:scale-95"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call</span>
              </button>
            )}
          </div>

          {/* Live Transcript Box */}
          {callTranscript.length > 0 && (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left max-h-48 overflow-y-auto space-y-2 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Live Conversation Log:
              </span>
              {callTranscript.map((line, idx) => (
                <p
                  key={idx}
                  className={`leading-relaxed ${
                    line.startsWith('You:')
                      ? 'text-indigo-300'
                      : line.startsWith('VEXO:')
                      ? 'text-cyan-300'
                      : 'text-slate-400 italic'
                  }`}
                >
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Audio Transcribe */}
      {activeTab === 'transcribe' && (
        <div className="p-6 md:p-8 rounded-3xl bg-[#121824] border border-white/10 space-y-6 max-w-3xl mx-auto shadow-xl">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Neural Audio Transcription
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Upload recordings, voice memos, or lectures and transcribe them into clean text.
            </p>
          </div>

          {/* File Picker */}
          <div className="p-6 border-2 border-dashed border-white/10 hover:border-cyan-500/50 rounded-2xl text-center bg-white/[0.02] cursor-pointer transition-colors">
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                if (e.target.files?.[0]) setTranscribeFile(e.target.files[0]);
              }}
              className="hidden"
              id="audio-upload"
            />
            <label htmlFor="audio-upload" className="cursor-pointer block space-y-2">
              <Upload className="w-8 h-8 text-cyan-400 mx-auto opacity-70" />
              <p className="text-xs text-slate-300 font-medium">
                {transcribeFile ? transcribeFile.name : 'Click or drop audio file (MP3, WAV, WEBM)'}
              </p>
              <span className="text-[10px] text-slate-500">Up to 25MB</span>
            </label>
          </div>

          <button
            onClick={handleTranscribe}
            disabled={!transcribeFile || isTranscribing}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg transition-all disabled:opacity-50"
          >
            {isTranscribing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Transcribing Spoken Audio...</span>
              </>
            ) : (
              <span>Transcribe Recording</span>
            )}
          </button>

          {transcribedText && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Transcript Result</span>
                <button
                  onClick={() => onSendToChat(transcribedText)}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to Chat</span>
                </button>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {transcribedText}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
