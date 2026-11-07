import React from 'react';
import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
  onOpenInCanvas?: (code: string, language: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onOpenInCanvas }) => {
  // Regex to split code blocks and normal markdown
  const codeBlockRegex = /```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)```/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text preceding the code block
    if (match.index > lastIndex) {
      const textChunk = content.slice(lastIndex, match.index);
      parts.push(
        <div key={`text-${lastIndex}`} className="markdown-chunk whitespace-pre-wrap">
          {renderFormattedText(textChunk)}
        </div>
      );
    }

    const language = match[1] || 'text';
    const code = match[2];
    parts.push(
      <CodeBlock
        key={`code-${match.index}`}
        language={language}
        code={code}
        onOpenInCanvas={onOpenInCanvas}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  // Add trailing text
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex);
    parts.push(
      <div key={`text-${lastIndex}`} className="markdown-chunk whitespace-pre-wrap">
        {renderFormattedText(remainingText)}
      </div>
    );
  }

  return <div className="markdown-body space-y-2">{parts}</div>;
};

// Formatter for markdown headers, lists, bold, italic, inline code
function renderFormattedText(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Heading 1
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-xl font-bold text-white mt-4 mb-2">
          {formatInline(line.slice(2))}
        </h1>
      );
      continue;
    }
    // Heading 2
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-lg font-bold text-slate-100 mt-3 mb-1.5">
          {formatInline(line.slice(3))}
        </h2>
      );
      continue;
    }
    // Heading 3
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-base font-semibold text-slate-200 mt-2 mb-1">
          {formatInline(line.slice(4))}
        </h3>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-indigo-500 pl-3 py-0.5 text-slate-300 italic my-1.5 bg-white/[0.02] rounded-r">
          {formatInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Bullet list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex items-start gap-2 ml-2 my-0.5">
          <span className="text-indigo-400 font-bold text-base leading-none select-none">•</span>
          <span className="text-slate-200">{formatInline(line.slice(2))}</span>
        </div>
      );
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={i} className="flex items-start gap-2 ml-2 my-0.5">
          <span className="text-indigo-400 font-medium font-mono text-xs pt-1 select-none">{numMatch[1]}.</span>
          <span className="text-slate-200">{formatInline(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Horizontal Rule
    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={i} className="my-4 border-white/10" />);
      continue;
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-slate-200 leading-relaxed">
        {formatInline(line)}
      </p>
    );
  }

  return elements;
}

// Inline formatting: `code`, **bold**, *italic*, [link](url)
function formatInline(text: string): React.ReactNode {
  // Split inline code first
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 text-[0.84em] bg-white/10 text-indigo-300 rounded font-mono border border-white/5"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Process bold and italic
    return (
      <span key={index} dangerouslySetInnerHTML={{ __html: sanitizeInline(part) }} />
    );
  });
}

function sanitizeInline(str: string): string {
  return str
    // Escape HTML tags to prevent XSS
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Bold: **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    // Italic: *text*
    .replace(/\*(.*?)\*/g, '<em class="italic text-slate-300">$1</em>')
    // Link: [label](url)
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-400 underline underline-offset-2 hover:text-indigo-300">$1</a>');
}
