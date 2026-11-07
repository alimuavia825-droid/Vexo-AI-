import React, { useState } from 'react';
import { Check, Copy, Play, ExternalLink, Code2 } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
  onOpenInCanvas?: (code: string, language: string) => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code, onOpenInCanvas }) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const cleanLang = (language || 'text').toLowerCase().trim();
  const isWebCode = ['html', 'javascript', 'js', 'svg'].includes(cleanLang);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy code:', e);
    }
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-white/10 bg-[#0d121d] shadow-lg">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#090d15] border-b border-white/5 text-xs text-slate-400">
        <div className="flex items-center gap-2 font-mono">
          <Code2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="uppercase tracking-wider font-semibold text-slate-300">{cleanLang}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {isWebCode && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                showPreview ? 'bg-indigo-600 text-white' : 'hover:bg-white/10 text-slate-300'
              }`}
              title="Toggle interactive runner"
            >
              <Play className="w-3 h-3" />
              <span>{showPreview ? 'Show Code' : 'Live Preview'}</span>
            </button>
          )}

          {onOpenInCanvas && (
            <button
              onClick={() => onOpenInCanvas(code, cleanLang)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-white/10 text-slate-300 transition-colors"
              title="Open in VEXO Canvas workspace"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Canvas</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-white/10 text-slate-300 transition-colors"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Content or Live Preview */}
      {showPreview && isWebCode ? (
        <div className="p-4 bg-white rounded-b-xl min-h-[180px]">
          {cleanLang === 'svg' ? (
            <div dangerouslySetInnerHTML={{ __html: code }} className="flex justify-center items-center" />
          ) : (
            <iframe
              srcDoc={
                cleanLang === 'html'
                  ? code
                  : `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{font-family:sans-serif;padding:12px;color:#1e293b;}</style></head><body><div id="app"></div><script>${code}<\/script></body></html>`
              }
              title="Code Preview"
              className="w-full h-64 border-0 rounded"
              sandbox="allow-scripts"
            />
          )}
        </div>
      ) : (
        <div className="overflow-x-auto p-4 text-[13px] leading-relaxed font-mono text-slate-200">
          <pre>
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
