import React, { useState } from 'react';
import {
  Code2,
  Play,
  Copy,
  Check,
  Download,
  Sparkles,
  FileText,
  RefreshCw,
  X,
  Maximize2,
  Minimize2,
  Bug,
  BookOpen,
  Zap,
} from 'lucide-react';

interface CanvasWorkspaceProps {
  initialCode?: string;
  initialLanguage?: string;
  onClose: () => void;
  onSendAICommand: (command: string, code: string) => void;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  initialCode = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle, #1e1b4b, #0f172a);
      color: white;
      font-family: system-ui, sans-serif;
    }
    .card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 2.5rem;
      border-radius: 1.5rem;
      backdrop-filter: blur(10px);
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    h1 { margin: 0 0 10px; font-size: 2rem; }
    p { color: #94a3b8; }
    button {
      margin-top: 20px;
      padding: 12px 24px;
      border-radius: 9999px;
      background: #6366f1;
      color: white;
      border: none;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s;
    }
    button:hover { background: #4f46e5; transform: scale(1.05); }
  </style>
</head>
<body>
  <div class="card">
    <h1>VEXO Canvas</h1>
    <p>Live sandbox code editor & execution preview</p>
    <button onclick="this.textContent = 'Awesome! Click count: ' + (++clicks)">Interactive Button</button>
  </div>
  <script>
    let clicks = 0;
  </script>
</body>
</html>`,
  initialLanguage = 'html',
  onClose,
  onSendAICommand,
}) => {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isWebCode = ['html', 'javascript', 'js', 'svg', 'css'].includes(language.toLowerCase());

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy code:', e);
    }
  };

  const handleDownload = () => {
    const ext = language === 'html' ? 'html' : language === 'javascript' ? 'js' : language === 'python' ? 'py' : 'txt';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vexo-code.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`flex flex-col bg-[#0b0f17] border-l border-white/10 z-20 ${
        isFullscreen ? 'fixed inset-0 z-50' : 'w-full lg:w-[480px] xl:w-[540px] h-full'
      }`}
    >
      {/* Top Canvas Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#080c14] border-b border-white/10">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-xs text-white uppercase tracking-wider">VEXO Canvas</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-mono">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mode Switcher */}
          {isWebCode && (
            <div className="flex items-center p-0.5 rounded-lg bg-white/5 border border-white/5 text-xs">
              <button
                onClick={() => setActiveTab('code')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === 'code' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === 'preview' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Runner
              </button>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            title="Copy code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400"
            title="Close Canvas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Quick Actions Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#090d15] border-b border-white/5 overflow-x-auto text-[11px]">
        <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] pl-1 mr-1">
          AI Tools:
        </span>
        <button
          onClick={() => onSendAICommand('Explain step-by-step how this code works and what each part does.', code)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white whitespace-nowrap transition-colors"
        >
          <BookOpen className="w-3 h-3 text-cyan-400" />
          <span>Explain</span>
        </button>

        <button
          onClick={() => onSendAICommand('Review this code for any bugs, security vulnerabilities, or edge-case errors, and provide the fixed code.', code)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white whitespace-nowrap transition-colors"
        >
          <Bug className="w-3 h-3 text-rose-400" />
          <span>Fix Bugs</span>
        </button>

        <button
          onClick={() => onSendAICommand('Refactor and optimize this code for maximum efficiency, readability, and modern best practices.', code)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white whitespace-nowrap transition-colors"
        >
          <Zap className="w-3 h-3 text-amber-400" />
          <span>Optimize</span>
        </button>

        <button
          onClick={() => onSendAICommand('Add comprehensive JSDoc/inline documentation and comments explaining the architecture.', code)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white whitespace-nowrap transition-colors"
        >
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>Add Comments</span>
        </button>
      </div>

      {/* Workspace Body */}
      <div className="flex-1 relative overflow-hidden bg-[#070b12]">
        {activeTab === 'preview' && isWebCode ? (
          <iframe
            srcDoc={
              language === 'html'
                ? code
                : `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{margin:0;font-family:sans-serif;background:#fff;color:#111;padding:16px;}</style></head><body><div id="root"></div><script>${code}<\/script></body></html>`
            }
            title="Canvas Runner"
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts"
          />
        ) : (
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-full p-4 bg-transparent font-mono text-xs md:text-[13px] text-slate-100 placeholder-slate-600 resize-none outline-none leading-relaxed"
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
};
