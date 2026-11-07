import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Image as ImageIcon,
  Mic,
  MicOff,
  X,
  FileText,
  FileCode,
  Music,
  Globe,
  Sparkles,
  Zap,
} from 'lucide-react';
import { FileAttachment } from '../types';
import { fileToBase64, fileToText, LiveSpeechRecognizer } from '../utils/audio';

interface ChatInputProps {
  onSendMessage: (text: string, attachments: FileAttachment[]) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  useWebSearch: boolean;
  onToggleWebSearch: () => void;
  onOpenImageStudio: () => void;
  isInstantFastMode?: boolean;
  onToggleInstantFastMode?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  useWebSearch,
  onToggleWebSearch,
  onOpenImageStudio,
  isInstantFastMode,
  onToggleInstantFastMode,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognizerRef = useRef<LiveSpeechRecognizer | null>(null);

  // Initialize Speech Recognizer
  useEffect(() => {
    recognizerRef.current = new LiveSpeechRecognizer(
      (transcript, isFinal) => {
        if (isFinal) {
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setInterimTranscript('');
        } else {
          setInterimTranscript(transcript);
        }
      },
      (error) => {
        console.warn('Voice input error:', error);
        setIsRecording(false);
        setInterimTranscript('');
      },
      () => {
        setIsRecording(false);
        setInterimTranscript('');
      }
    );
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [text, interimTranscript]);

  const handleToggleVoice = () => {
    if (!recognizerRef.current?.isSupported()) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    if (isRecording) {
      recognizerRef.current.stop();
      setIsRecording(false);
    } else {
      recognizerRef.current.start();
      setIsRecording(true);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newAttachments: FileAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await fileToBase64(file);
        let textContent: string | undefined;

        const isText =
          file.type.startsWith('text/') ||
          file.name.endsWith('.ts') ||
          file.name.endsWith('.tsx') ||
          file.name.endsWith('.js') ||
          file.name.endsWith('.jsx') ||
          file.name.endsWith('.py') ||
          file.name.endsWith('.json') ||
          file.name.endsWith('.md') ||
          file.name.endsWith('.csv') ||
          file.name.endsWith('.sql');

        if (isText) {
          textContent = await fileToText(file);
        }

        newAttachments.push({
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          mimeType: file.type || 'application/octet-stream',
          base64,
          previewUrl: file.type.startsWith('image/') ? base64 : undefined,
          isText,
          textContent,
        });
      } catch (err) {
        console.error('Error processing attached file:', err);
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    if (isStreaming) return;

    // Check if user typed `/imagine`
    if (trimmed.startsWith('/imagine ')) {
      onSendMessage(trimmed, attachments);
    } else {
      onSendMessage(trimmed, attachments);
    }

    setText('');
    setAttachments([]);
    setInterimTranscript('');
    if (isRecording) {
      recognizerRef.current?.stop();
      setIsRecording(false);
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 pb-3 md:pb-5">
      {/* Drag & Drop Container */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`relative rounded-2xl bg-[#121824] border transition-all shadow-xl ${
          isDraggingOver
            ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-[#161f30]'
            : 'border-white/10 hover:border-white/15 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20'
        }`}
      >
        {/* Drag Overlay Banner */}
        {isDraggingOver && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-indigo-950/80 backdrop-blur-sm border-2 border-dashed border-indigo-400">
            <div className="text-center">
              <Paperclip className="w-8 h-8 text-indigo-300 mx-auto mb-1 animate-bounce" />
              <p className="text-sm font-semibold text-white">Drop images, PDFs, code or docs here</p>
            </div>
          </div>
        )}

        {/* Attachment Preview Chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 pb-0">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="group relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200"
              >
                {att.previewUrl ? (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="w-6 h-6 object-cover rounded-md"
                  />
                ) : att.isText ? (
                  <FileCode className="w-4 h-4 text-emerald-400" />
                ) : att.mimeType.startsWith('audio/') ? (
                  <Music className="w-4 h-4 text-cyan-400" />
                ) : (
                  <FileText className="w-4 h-4 text-indigo-400" />
                )}

                <span className="max-w-[140px] truncate font-medium">{att.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {(att.size / 1024).toFixed(0)}KB
                </span>

                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(att.id)}
                  className="p-0.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-rose-400"
                  title="Remove attachment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Input Area */}
        <div className="relative px-3 pt-3 pb-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? 'Listening to your voice...'
                : 'Ask VEXO-AI anything, upload files, or type /imagine for visuals...'
            }
            className="w-full bg-transparent text-sm md:text-[15px] text-slate-100 placeholder-slate-500 resize-none outline-none leading-relaxed min-h-[44px] max-h-[200px]"
          />

          {interimTranscript && (
            <div className="text-xs text-indigo-300 italic px-1 pb-1">
              {interimTranscript}...
            </div>
          )}
        </div>

        {/* Bottom Toolbar & Action Buttons */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          {/* Left Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />

            {/* Attach File Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Attach photos, PDFs, code, audio, or documents"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Image Studio Shortcut */}
            <button
              type="button"
              onClick={onOpenImageStudio}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors text-xs font-medium"
              title="Open VEXO Image Studio"
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Image Gen</span>
            </button>

            {/* Web Search Chip */}
            <button
              type="button"
              onClick={onToggleWebSearch}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                useWebSearch
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'
              }`}
              title="Live web search grounding"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search</span>
            </button>

            {/* Instant Fast Mode Chip */}
            {onToggleInstantFastMode && (
              <button
                type="button"
                onClick={onToggleInstantFastMode}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  isInstantFastMode
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'
                }`}
                title="Ultra-fast millisecond response mode"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">⚡ Fast (ms)</span>
              </button>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Mic Dictation */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`p-2 rounded-xl transition-all ${
                isRecording
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title={isRecording ? 'Stop listening' : 'Dictate with voice'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send / Stop Button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white shadow-md transition-all active:scale-95"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!text.trim() && attachments.length === 0}
                className={`p-2 rounded-xl transition-all ${
                  text.trim() || attachments.length > 0
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30 hover:opacity-95 active:scale-95'
                    : 'bg-white/5 text-slate-500 cursor-not-allowed'
                }`}
                title="Send prompt (Enter)"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-500">
        <span>VEXO-AI may produce mistakes. Verify critical code and data.</span>
        <span className="hidden sm:inline">Use Shift + Enter for new lines</span>
      </div>
    </div>
  );
};
