import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Image,
  Mic,
  Code2,
  BookOpen,
  Settings,
  Pin,
  Trash2,
  Edit2,
  MoreVertical,
  Download,
  Bot,
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { ActiveTab, ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  activeTab: ActiveTab;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onTogglePinSession: (id: string) => void;
  onExportSession: (session: ChatSession) => void;
  onChangeTab: (tab: ActiveTab) => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  activeTab,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onTogglePinSession,
  onExportSession,
  onChangeTab,
  onOpenSettings,
  isOpen,
  onToggleOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuSessionId, setMenuSessionId] = useState<string | null>(null);

  // Filtered sessions
  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Grouping by time
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  const pinnedSessions = filteredSessions.filter((s) => s.pinned);
  const unpinnedSessions = filteredSessions.filter((s) => !s.pinned);

  const todaySessions = unpinnedSessions.filter((s) => now - s.updatedAt < ONE_DAY);
  const yesterdaySessions = unpinnedSessions.filter(
    (s) => now - s.updatedAt >= ONE_DAY && now - s.updatedAt < 2 * ONE_DAY
  );
  const last7DaysSessions = unpinnedSessions.filter(
    (s) => now - s.updatedAt >= 2 * ONE_DAY && now - s.updatedAt < 7 * ONE_DAY
  );
  const olderSessions = unpinnedSessions.filter((s) => now - s.updatedAt >= 7 * ONE_DAY);

  const startEditing = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
    setMenuSessionId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onToggleOpen}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-72 bg-[#080c14] border-r border-white/10 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-72'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-md shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#080c14]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white">VEXO-AI</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v3.8
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Next-Gen Intelligence</p>
            </div>
          </div>

          <button
            onClick={onToggleOpen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 md:hidden"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action: New Chat */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onChangeTab('chat');
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Chat</span>
            </div>
            <kbd className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/20 text-indigo-100">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="px-3 pb-2 space-y-1">
          <button
            onClick={() => onChangeTab('chat')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'chat'
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span>Chat Assistant</span>
          </button>

          <button
            onClick={() => onChangeTab('image-studio')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'image-studio'
                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Image className="w-4 h-4 text-purple-400" />
            <div className="flex items-center justify-between flex-1">
              <span>Image Studio</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 rounded-full font-mono">
                GenAI
              </span>
            </div>
          </button>

          <button
            onClick={() => onChangeTab('voice-studio')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'voice-studio'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Mic className="w-4 h-4 text-cyan-400" />
            <div className="flex items-center justify-between flex-1">
              <span>Voice Studio</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 rounded-full font-mono">
                Live TTS
              </span>
            </div>
          </button>

          <button
            onClick={() => onChangeTab('canvas')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'canvas'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span>Canvas Sandbox</span>
          </button>

          <button
            onClick={() => onChangeTab('prompts')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'prompts'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Prompt Library</span>
          </button>
        </div>

        {/* Search Chat Input */}
        <div className="px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08]"
            />
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 text-xs">
          {/* Pinned Section */}
          {pinnedSessions.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 mb-1 text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                <Pin className="w-3 h-3 fill-amber-400/20" />
                <span>Pinned</span>
              </div>
              <div className="space-y-0.5">
                {pinnedSessions.map((session) => renderSessionItem(session))}
              </div>
            </div>
          )}

          {/* Today */}
          {todaySessions.length > 0 && (
            <div>
              <div className="px-2 mb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Today
              </div>
              <div className="space-y-0.5">
                {todaySessions.map((session) => renderSessionItem(session))}
              </div>
            </div>
          )}

          {/* Yesterday */}
          {yesterdaySessions.length > 0 && (
            <div>
              <div className="px-2 mb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Yesterday
              </div>
              <div className="space-y-0.5">
                {yesterdaySessions.map((session) => renderSessionItem(session))}
              </div>
            </div>
          )}

          {/* Last 7 Days */}
          {last7DaysSessions.length > 0 && (
            <div>
              <div className="px-2 mb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Previous 7 Days
              </div>
              <div className="space-y-0.5">
                {last7DaysSessions.map((session) => renderSessionItem(session))}
              </div>
            </div>
          )}

          {/* Older */}
          {olderSessions.length > 0 && (
            <div>
              <div className="px-2 mb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Older
              </div>
              <div className="space-y-0.5">
                {olderSessions.map((session) => renderSessionItem(session))}
              </div>
            </div>
          )}

          {filteredSessions.length === 0 && (
            <div className="p-4 text-center text-slate-500">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-xs">No conversations found</p>
            </div>
          )}
        </div>

        {/* Footer Settings & Status */}
        <div className="p-3 border-t border-white/5 bg-[#060910]">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] text-slate-500">
              {sessions.length} {sessions.length === 1 ? 'chat' : 'chats'} stored
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-xs font-medium"
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings & Personalization</span>
            </div>
            <span className="text-[10px] text-slate-500">Configure</span>
          </button>
        </div>
      </aside>
    </>
  );

  function renderSessionItem(session: ChatSession) {
    const isActive = session.id === activeSessionId && activeTab === 'chat';
    const isEditing = editingSessionId === session.id;

    return (
      <div
        key={session.id}
        onClick={() => {
          onSelectSession(session.id);
          onChangeTab('chat');
        }}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${
          isActive
            ? 'bg-indigo-600/20 text-white font-medium border-l-2 border-indigo-500'
            : 'text-slate-300 hover:bg-white/5 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              autoFocus
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={() => handleSaveRename(session.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename(session.id);
                if (e.key === 'Escape') setEditingSessionId(null);
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/10 text-white text-xs px-1.5 py-0.5 rounded outline-none w-full border border-indigo-500"
            />
          ) : (
            <span className="truncate text-xs">{session.title}</span>
          )}
        </div>

        {/* Hover / Active Actions */}
        {!isEditing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePinSession(session.id);
              }}
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-amber-400"
              title={session.pinned ? 'Unpin chat' : 'Pin chat'}
            >
              <Pin className={`w-3 h-3 ${session.pinned ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>

            <button
              onClick={(e) => startEditing(session, e)}
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
              title="Rename title"
            >
              <Edit2 className="w-3 h-3" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onExportSession(session);
              }}
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
              title="Export chat"
            >
              <Download className="w-3 h-3" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-rose-400"
              title="Delete conversation"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  }
};
