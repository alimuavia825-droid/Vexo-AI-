import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Code2,
  PenTool,
  Briefcase,
  GraduationCap,
  Sparkles,
  X,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

interface PromptItem {
  id: string;
  category: 'code' | 'write' | 'business' | 'learn';
  title: string;
  description: string;
  prompt: string;
  tags: string[];
}

const PROMPT_DATABASE: PromptItem[] = [
  {
    id: '1',
    category: 'code',
    title: 'Full-Stack React + Node.js Architecture',
    description: 'Design a clean, scalable production architecture with file trees, database schema, and security rules.',
    prompt: 'Act as a Principal Software Architect. Design a production-ready web application architecture for a modern SaaS platform. Include recommended tech stack, directory structure, database schema, and authentication flow.',
    tags: ['Architecture', 'React', 'Node'],
  },
  {
    id: '2',
    category: 'code',
    title: 'Code Refactoring & Performance Optimizer',
    description: 'Optimize slow functions, eliminate bottlenecks, and enhance readability.',
    prompt: 'Please review and refactor the following code. Identify performance bottlenecks, improve time/space complexity, and modernize it using current best practices with clean TypeScript/JavaScript:\n\n[PASTE YOUR CODE HERE]',
    tags: ['Refactor', 'Performance'],
  },
  {
    id: '3',
    category: 'code',
    title: 'RESTful API & Database Schema Designer',
    description: 'Generate normalized SQL schema and corresponding REST endpoints.',
    prompt: 'Create a fully normalized database schema (PostgreSQL) and RESTful API endpoint specification for an e-commerce platform with multi-tenant inventory, carts, orders, and payment tracking.',
    tags: ['Database', 'SQL', 'API'],
  },
  {
    id: '4',
    category: 'write',
    title: 'Viral Technical Article / Explainer',
    description: 'Draft an engaging, deeply insightful technical essay with hook, diagrams, and takeaways.',
    prompt: 'Write an engaging, high-retention technical explainer article breaking down how modern LLM transformer attention mechanisms work. Use vivid analogies, zero jargon fluff, and actionable takeaways.',
    tags: ['Writing', 'Tech Blog'],
  },
  {
    id: '5',
    category: 'write',
    title: 'Sci-Fi Worldbuilder & Character Arc',
    description: 'Develop rich lore, technological ecosystems, and character conflict.',
    prompt: 'Create a rich cyberpunk / solarpunk worldbuilding bible set in the year 2140. Detail the societal power structure, dominant AI operating system, daily life of citizens, and a compelling protagonist conflict.',
    tags: ['Creative', 'Fiction'],
  },
  {
    id: '6',
    category: 'business',
    title: 'SaaS Pitch Deck & Value Proposition',
    description: 'Craft a compelling 10-slide pitch outline with problem, solution, TAM, and business model.',
    prompt: 'Act as a seasoned Silicon Valley venture capitalist and pitch advisor. Create a compelling 10-slide pitch deck structure for an AI-powered developer productivity tool, including crisp narrative hooks and market metrics.',
    tags: ['Startup', 'Pitch'],
  },
  {
    id: '7',
    category: 'business',
    title: 'Executive Summary & Action Item Extractor',
    description: 'Transform lengthy documents or meeting transcripts into concise bullet points.',
    prompt: 'Please review the following raw meeting notes/transcript. Extract: 1) Executive Summary (3 sentences), 2) Key Strategic Decisions Made, 3) Action Items assigned with owners and urgency:\n\n[PASTE NOTES HERE]',
    tags: ['Productivity', 'Meetings'],
  },
  {
    id: '8',
    category: 'learn',
    title: 'The Feynman Technique Master Explainer',
    description: 'Explain advanced scientific or mathematical concepts so a 10-year-old can intuitively understand.',
    prompt: 'Use the Feynman Technique to explain the concept of Generative Adversarial Networks (GANs). Start with an intuitive analogy, explain the underlying mechanism simply, and highlight why it is significant.',
    tags: ['Education', 'Feynman'],
  },
];

export const PromptLibraryModal: React.FC<PromptLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'code' | 'write' | 'business' | 'learn'>('all');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = PROMPT_DATABASE.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="relative w-full max-w-3xl max-h-[85vh] rounded-3xl bg-[#0e1420] border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#090d15]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">VEXO Prompt Library</h2>
              <p className="text-xs text-slate-400">Curated, high-performing prompts for reasoning and creation</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-white/5 bg-[#0a0f18] space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompt templates by keyword or tag..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'All Templates' },
              { id: 'code', label: 'Coding & Architecture', icon: Code2 },
              { id: 'write', label: 'Creative & Writing', icon: PenTool },
              { id: 'business', label: 'Business & Strategy', icon: Briefcase },
              { id: 'learn', label: 'Education & STEM', icon: GraduationCap },
            ].map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompts Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-amber-500/30 transition-all hover:bg-white/[0.08]"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-xs text-white group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex gap-1">
                    {item.tags.map((t, idx) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              </div>

              <button
                onClick={() => {
                  onSelectPrompt(item.prompt);
                  onClose();
                }}
                className="mt-4 flex items-center justify-between w-full px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/20 transition-colors"
              >
                <span>Use Prompt</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
