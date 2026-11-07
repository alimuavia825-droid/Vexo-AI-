import React, { useRef, useEffect, useState } from 'react';
import {
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  ArrowDown,
  Code2,
  Image as ImageIcon,
  Compass,
  Zap,
  BookOpen,
  FileText,
  FileCode,
  Music,
  ExternalLink,
  Brain,
  Download,
} from 'lucide-react';
import { ChatMessage, FileAttachment } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { speakTextBrowser } from '../utils/audio';

interface ChatViewProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSendMessage: (text: string, attachments?: FileAttachment[]) => void;
  onRegenerate: () => void;
  onOpenInCanvas?: (code: string, language: string) => void;
  onOpenImageStudio: () => void;
  onOpenVoiceStudio: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  isStreaming,
  onSendMessage,
  onRegenerate,
  onOpenInCanvas,
  onOpenImageStudio,
  onOpenVoiceStudio,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioStopFn, setAudioStopFn] = useState<(() => void) | null>(null);
  const [userRating, setUserRating] = useState<Record<string, 'up' | 'down'>>({});
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages or streaming
  useEffect(() => {
    if (!showScrollBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming, showScrollBottom]);

  // Check scroll position to toggle scroll-to-bottom button
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 180;
    setShowScrollBottom(isUp);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error('Failed to copy message:', e);
    }
  };

  const handleSpeak = async (message: ChatMessage) => {
    // If currently playing, stop it
    if (playingAudioId === message.id) {
      audioStopFn?.();
      setPlayingAudioId(null);
      setAudioStopFn(null);
      return;
    }

    if (audioStopFn) {
      audioStopFn();
    }

    setPlayingAudioId(message.id);

    try {
      // Try server TTS first
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message.content.slice(0, 800),
          voiceName: 'Kore',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioUrl) {
          const audio = new Audio(data.audioUrl);
          audio.onended = () => {
            setPlayingAudioId(null);
            setAudioStopFn(null);
          };
          audio.onerror = () => {
            // Fallback to browser TTS
            fallbackToBrowserSpeech(message);
          };
          audio.play();
          setAudioStopFn(() => () => audio.pause());
          return;
        }
      }
    } catch (e) {
      // Fallback
    }

    fallbackToBrowserSpeech(message);
  };

  const fallbackToBrowserSpeech = (message: ChatMessage) => {
    const stop = speakTextBrowser(message.content, 1.0, () => {
      setPlayingAudioId(null);
      setAudioStopFn(null);
    });
    setAudioStopFn(() => stop);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-3 md:px-6 py-6 space-y-6 relative"
    >
      {/* Empty State / Welcome Hero */}
      {messages.length === 0 && (
        <div className="max-w-3xl mx-auto py-8 md:py-16 text-center animate-in fade-in zoom-in-95 duration-300">
          {/* Glowing Emblem */}
          <div className="relative inline-block mb-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-xl shadow-indigo-500/30 glow-accent mx-auto">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-cyan-400 text-[10px] font-bold text-slate-950 uppercase tracking-wider">
              PRO
            </div>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
            What can <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-300 bg-clip-text text-transparent">VEXO-AI</span> do for you today?
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-lg mx-auto mb-10 leading-relaxed">
            Multi-modal reasoning, intelligent code execution, full-fidelity image generation, and natural voice synthesis.
          </p>

          {/* Quick Starter Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
            <button
              onClick={() =>
                onSendMessage('Create a modern React + Tailwind landing page hero component with smooth animations and code.')
              }
              className="group p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/30 transition-all text-left"
            >
              <div className="flex items-center gap-2 text-indigo-400 mb-1 text-xs font-semibold">
                <Code2 className="w-4 h-4" />
                <span>Frontend Architecture</span>
              </div>
              <p className="text-xs text-slate-300 group-hover:text-white leading-relaxed">
                Build a modern React + Tailwind landing page hero with animations
              </p>
            </button>

            <button
              onClick={() => onOpenImageStudio()}
              className="group p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all text-left"
            >
              <div className="flex items-center gap-2 text-purple-400 mb-1 text-xs font-semibold">
                <ImageIcon className="w-4 h-4" />
                <span>Creative Image Studio</span>
              </div>
              <p className="text-xs text-slate-300 group-hover:text-white leading-relaxed">
                Generate high-definition visuals, 3D renders, and cinematic wallpaper
              </p>
            </button>

            <button
              onClick={() => onOpenVoiceStudio()}
              className="group p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 transition-all text-left"
            >
              <div className="flex items-center gap-2 text-cyan-400 mb-1 text-xs font-semibold">
                <Zap className="w-4 h-4" />
                <span>Voice Studio & Call</span>
              </div>
              <p className="text-xs text-slate-300 group-hover:text-white leading-relaxed">
                Turn scripts into human-like audio or start a hands-free voice conversation
              </p>
            </button>

            <button
              onClick={() =>
                onSendMessage('Explain quantum computing and superposition using an intuitive analogy.')
              }
              className="group p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-500/30 transition-all text-left"
            >
              <div className="flex items-center gap-2 text-amber-400 mb-1 text-xs font-semibold">
                <Compass className="w-4 h-4" />
                <span>Deep Explanations</span>
              </div>
              <p className="text-xs text-slate-300 group-hover:text-white leading-relaxed">
                Explain complex quantum physics using intuitive real-world analogies
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Message Feed */}
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const isAssistant = message.role === 'assistant';
          const isCopied = copiedId === message.id;
          const isPlaying = playingAudioId === message.id;

          return (
            <div
              key={message.id}
              className={`flex gap-3 md:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {/* Assistant Avatar */}
              {isAssistant && (
                <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-600/20 text-white mt-1">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              {/* Message Content Bubble */}
              <div
                className={`flex flex-col max-w-[85%] md:max-w-[78%] ${
                  isUser ? 'items-end' : 'items-start'
                }`}
              >
                {/* User Bubble */}
                {isUser ? (
                  <div className="p-3.5 md:p-4 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/15">
                    {/* Attachments if any */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2.5">
                        {message.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center gap-2 p-1.5 rounded-lg bg-black/20 border border-white/10 text-xs"
                          >
                            {att.previewUrl ? (
                              <img
                                src={att.previewUrl}
                                alt={att.name}
                                onClick={() => setSelectedImage(att.previewUrl!)}
                                className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-90"
                              />
                            ) : att.isText ? (
                              <FileCode className="w-5 h-5 text-emerald-300" />
                            ) : (
                              <FileText className="w-5 h-5 text-indigo-200" />
                            )}
                            <div className="min-w-0 pr-1">
                              <p className="truncate font-medium max-w-[120px]">{att.name}</p>
                              <span className="text-[10px] text-white/70">
                                {(att.size / 1024).toFixed(0)} KB
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="whitespace-pre-wrap text-sm md:text-[15px] leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                ) : (
                  /* Assistant Bubble */
                  <div className="w-full p-4 md:p-5 rounded-2xl bg-[#121824] border border-white/10 text-slate-100 shadow-xl">
                    {/* Header bar: Model tag & timestamp */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span className="text-slate-300 font-semibold">
                          {message.modelUsed === 'gemini-3.1-flash-lite'
                            ? 'VEXO Lightning Instant'
                            : message.modelUsed === 'gemini-4-argon'
                            ? 'VEXO 4 Argon Pro'
                            : 'VEXO 3.8 Flash'}
                        </span>
                      </div>
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Reasoning Details if present */}
                    {message.reasoning && (
                      <details className="mb-4 rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-slate-300">
                        <summary className="font-semibold text-indigo-300 cursor-pointer flex items-center gap-1.5">
                          <Brain className="w-3.5 h-3.5" />
                          <span>View Thinking Process</span>
                        </summary>
                        <p className="mt-2 text-slate-400 leading-relaxed font-mono whitespace-pre-wrap">
                          {message.reasoning}
                        </p>
                      </details>
                    )}

                    {/* Instant Generating Pulse when starting */}
                    {message.isStreaming && !message.content && (
                      <div className="flex items-center gap-2 text-xs text-amber-300 py-1 font-mono">
                        <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                        <span className="animate-pulse">Generating answer...</span>
                      </div>
                    )}

                    {/* Error display */}
                    {message.error ? (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                        {message.error}
                      </div>
                    ) : (
                      /* Formatted Markdown Content */
                      <MarkdownRenderer
                        content={message.content}
                        onOpenInCanvas={onOpenInCanvas}
                      />
                    )}

                    {/* Streaming Cursor */}
                    {message.isStreaming && message.content && (
                      <span className="inline-block w-2 h-4 ml-1 bg-indigo-400 animate-pulse align-middle" />
                    )}

                    {/* Assistant Action Buttons */}
                    {!message.isStreaming && !message.error && (
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-slate-400 text-xs">
                        <div className="flex items-center gap-1">
                          {/* Copy */}
                          <button
                            onClick={() => handleCopy(message.id, message.content)}
                            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                            title="Copy response"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Text to Speech */}
                          <button
                            onClick={() => handleSpeak(message)}
                            className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                              isPlaying ? 'text-indigo-400 bg-indigo-500/15' : 'hover:text-white'
                            }`}
                            title={isPlaying ? 'Stop audio' : 'Listen to response'}
                          >
                            {isPlaying ? (
                              <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Regenerate */}
                          <button
                            onClick={onRegenerate}
                            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                            title="Regenerate reply"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Thumbs up / down feedback */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setUserRating((prev) => ({
                                ...prev,
                                [message.id]: prev[message.id] === 'up' ? undefined! : 'up',
                              }))
                            }
                            className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                              userRating[message.id] === 'up'
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : 'hover:text-white'
                            }`}
                            title="Good response"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() =>
                              setUserRating((prev) => ({
                                ...prev,
                                [message.id]: prev[message.id] === 'down' ? undefined! : 'down',
                              }))
                            }
                            className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                              userRating[message.id] === 'down'
                                ? 'text-rose-400 bg-rose-500/10'
                                : 'hover:text-white'
                            }`}
                            title="Bad response"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Avatar */}
              {isUser && (
                <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center text-white mt-1 border border-white/10">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-28 right-8 p-2.5 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all z-20"
          title="Scroll to latest message"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Image Modal Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Zoomed Attachment"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <a
                href={selectedImage}
                download="vexo-image.png"
                className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
