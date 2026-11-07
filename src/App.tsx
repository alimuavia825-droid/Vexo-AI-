import React, { useState, useEffect, useRef } from 'react';
import {
  ActiveTab,
  AppSettings,
  ChatMessage,
  ChatSession,
  FileAttachment,
  ImageGenerationItem,
  VoiceStudioItem,
} from './types';
import {
  loadActiveSessionId,
  loadSavedImages,
  loadSessions,
  loadSettings,
  loadVoiceItems,
  saveActiveSessionId,
  saveImages,
  saveSessions,
  saveSettings,
  saveVoiceItems,
} from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { ChatInput } from './components/ChatInput';
import { ImageStudio } from './components/ImageStudio';
import { VoiceStudio } from './components/VoiceStudio';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { PromptLibraryModal } from './components/PromptLibraryModal';
import { SettingsModal } from './components/SettingsModal';
import { sounds, speakTextBrowser } from './utils/audio';

export default function App() {
  // Core Application State
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => loadActiveSessionId());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');

  // Media Collections
  const [images, setImages] = useState<ImageGenerationItem[]>(() => loadSavedImages());
  const [voiceItems, setVoiceItems] = useState<VoiceStudioItem[]>(() => loadVoiceItems());

  // Workspace & Modals State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [canvasCode, setCanvasCode] = useState<string | undefined>(undefined);
  const [canvasLanguage, setCanvasLanguage] = useState<string | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);

  // Streaming State
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Active Session Resolution
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // Persist sessions
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  // Persist active session ID
  useEffect(() => {
    saveActiveSessionId(activeSessionId);
  }, [activeSessionId]);

  // Persist settings
  useEffect(() => {
    saveSettings(settings);
    // Apply theme class to document body
    document.body.className = `theme-${settings.theme}`;
  }, [settings]);

  // Persist images
  useEffect(() => {
    saveImages(images);
  }, [images]);

  // Persist voice items
  useEffect(() => {
    saveVoiceItems(voiceItems);
  }, [voiceItems]);

  // Keyboard shortcut for New Chat (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Ensure an initial session exists and sessions use the instant model
  useEffect(() => {
    if (sessions.length === 0) {
      handleNewChat();
    } else {
      // Migrate sessions to instant engine
      setSessions((prev) =>
        prev.map((s) =>
          !s.model || s.model === 'gemini-3.8-flash'
            ? { ...s, model: 'gemini-3.1-flash-lite' }
            : s
        )
      );
      if (!activeSessionId) {
        setActiveSessionId(sessions[0].id);
      }
    }
  }, []);

  // Create New Chat Session
  const handleNewChat = () => {
    if (isStreaming) {
      handleStopStreaming();
    }
    const newSession: ChatSession = {
      id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      model: settings.defaultModel,
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setActiveTab('chat');
  };

  // Delete Session
  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // Rename Session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  };

  // Toggle Pin
  const handleTogglePinSession = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s))
    );
  };

  // Export Session
  const handleExportSession = (session: ChatSession) => {
    let markdown = `# ${session.title}\n\n`;
    markdown += `*Date: ${new Date(session.createdAt).toLocaleString()}*\n\n---\n\n`;
    for (const msg of session.messages) {
      markdown += `### ${msg.role === 'user' ? '👤 User' : '✨ VEXO-AI'}\n\n${msg.content}\n\n`;
    }
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stop Streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Send Message Flow
  const handleSendMessage = async (text: string, attachments: FileAttachment[] = []) => {
    if (isStreaming) return;

    let targetSessionId = activeSessionId;
    let currentSession = sessions.find((s) => s.id === targetSessionId);

    // If no active session, create one
    if (!currentSession) {
      const newSession: ChatSession = {
        id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: text.slice(0, 32) || 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        model: settings.defaultModel,
      };
      setSessions((prev) => [newSession, ...prev]);
      targetSessionId = newSession.id;
      setActiveSessionId(newSession.id);
      currentSession = newSession;
    }

    if (settings.soundEffects) {
      sounds.playSend();
    }

    // 1. Create User Message
    const userMessage: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments,
    };

    // 2. Create Placeholder Assistant Message
    const assistantMessageId = `msg_a_${Date.now() + 1}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      modelUsed: currentSession.model || settings.defaultModel,
      isStreaming: true,
    };

    const updatedMessages = [...currentSession.messages, userMessage, assistantMessage];

    // Auto-update session title if it's the first message
    const isFirst = currentSession.messages.length === 0;
    const newTitle = isFirst ? generateTitleFromPrompt(text) : currentSession.title;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === targetSessionId
          ? {
              ...s,
              title: newTitle,
              updatedAt: Date.now(),
              messages: updatedMessages,
            }
          : s
      )
    );

    // Check if prompt is an inline image command (/imagine ...)
    if (text.trim().startsWith('/imagine ')) {
      await handleInlineImageGeneration(
        text.replace('/imagine ', '').trim(),
        targetSessionId!,
        assistantMessageId
      );
      return;
    }

    // Stream from server SSE endpoint
    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Build system prompt with personal context & tone
      let systemPrompt = settings.systemPersona;
      if (settings.userInstructions) {
        systemPrompt += `\n\nUser Context:\n${settings.userInstructions}`;
      }
      if (settings.responseTone === 'concise') {
        systemPrompt += '\n\nTone instruction: Provide concise, high-density, direct responses without introductory filler.';
      } else if (settings.responseTone === 'detailed') {
        systemPrompt += '\n\nTone instruction: Provide comprehensive, in-depth, step-by-step responses with clear breakdowns.';
      } else if (settings.responseTone === 'code-first') {
        systemPrompt += '\n\nTone instruction: Focus primarily on clean, high-quality code implementation first, followed by essential notes.';
      }

      // Convert messages for API (exclude streaming assistant message)
      const outgoingMessages = [...currentSession.messages, userMessage];

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: outgoingMessages,
          model: currentSession.model === 'gemini-4-argon' ? 'gemini-4-argon' : 'gemini-3.1-flash-lite',
          systemInstruction: systemPrompt,
          thinkingLevel: 'MINIMAL',
          useSearch: settings.enableWebSearch,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to get response`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataPayload = trimmed.slice(6);
              if (dataPayload === '[DONE]') {
                break;
              }
              try {
                const parsed = JSON.parse(dataPayload);
                if (parsed.text) {
                  accumulatedText += parsed.text;

                  // Update UI with stream
                  setSessions((prev) =>
                    prev.map((s) =>
                      s.id === targetSessionId
                        ? {
                            ...s,
                            messages: s.messages.map((m) =>
                              m.id === assistantMessageId
                                ? { ...m, content: accumulatedText, isStreaming: true }
                                : m
                            ),
                          }
                        : s
                    )
                  );
                }
              } catch (e) {
                // Ignore parse errors on raw tokens
              }
            }
          }
        }
      }

      // Finalize streaming
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: accumulatedText, isStreaming: false }
                    : m
                ),
              }
            : s
        )
      );

      if (settings.soundEffects) {
        sounds.playReceive();
      }

      // Auto-play TTS if enabled in voice settings
      if (settings.voiceSettings.autoPlayVoice && accumulatedText) {
        speakTextBrowser(accumulatedText.slice(0, 400), settings.voiceSettings.speechRate);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Chat stream failure:', err);
        setSessions((prev) =>
          prev.map((s) =>
            s.id === targetSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          content:
                            m.content ||
                            'I encountered an error generating a response. If your API key needs configuration, please check the Settings > Secrets panel.',
                          isStreaming: false,
                          error: err.message,
                        }
                      : m
                  ),
                }
              : s
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Inline Image Generation for `/imagine [prompt]`
  const handleInlineImageGeneration = async (
    imagePrompt: string,
    sessionId: string,
    messageId: string
  ) => {
    setIsStreaming(true);
    try {
      const res = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt, aspectRatio: '1:1' }),
      });
      const data = await res.json();

      if (data.imageUrl) {
        const markdown = `![Generated Image](${data.imageUrl})\n\n**Generated Visual for:** *"${imagePrompt}"*`;
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === messageId
                      ? { ...m, content: markdown, isStreaming: false }
                      : m
                  ),
                }
              : s
          )
        );

        // Also save to Image Studio gallery
        const newImg: ImageGenerationItem = {
          id: `${Date.now()}`,
          prompt: imagePrompt,
          style: 'photorealistic',
          aspectRatio: '1:1',
          imageUrl: data.imageUrl,
          createdAt: Date.now(),
        };
        setImages((prev) => [newImg, ...prev]);
      } else {
        throw new Error(data.error || 'Failed to generate inline image');
      }
    } catch (e: any) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === messageId
                    ? {
                        ...m,
                        content: `Image generation request: "${imagePrompt}"`,
                        error: e.message || 'Image generation failed',
                        isStreaming: false,
                      }
                    : m
                ),
              }
            : s
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  // Regenerate last assistant response
  const handleRegenerate = () => {
    if (!activeSession || activeSession.messages.length < 2 || isStreaming) return;
    let lastUserIndex = -1;
    for (let i = activeSession.messages.length - 1; i >= 0; i--) {
      if (activeSession.messages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }
    if (lastUserIndex === -1) return;

    const lastUserMessage = activeSession.messages[lastUserIndex];
    // Trim conversation up to the last user message
    const trimmedMessages = activeSession.messages.slice(0, lastUserIndex);

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id ? { ...s, messages: trimmedMessages } : s
      )
    );

    handleSendMessage(lastUserMessage.content, lastUserMessage.attachments);
  };

  // Canvas Workspace Integration
  const handleOpenInCanvas = (code: string, language: string) => {
    setCanvasCode(code);
    setCanvasLanguage(language);
    setIsCanvasOpen(true);
  };

  const handleSendCanvasCommand = (command: string, code: string) => {
    const prompt = `${command}\n\n\`\`\`${canvasLanguage || 'html'}\n${code}\n\`\`\``;
    setActiveTab('chat');
    handleSendMessage(prompt);
  };

  function generateTitleFromPrompt(prompt: string): string {
    const clean = prompt.replace(/^\/imagine\s+/i, '').trim();
    if (!clean) return 'New Conversation';
    const words = clean.split(/\s+/).slice(0, 5).join(' ');
    return words.length > 30 ? `${words.slice(0, 30)}...` : words;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f17] text-slate-100 antialiased font-sans">
      {/* 1. Left Sidebar (Recent Chats, Tabs, Brand) */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        activeTab={activeTab}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          setActiveTab('chat');
        }}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onTogglePinSession={handleTogglePinSession}
        onExportSession={handleExportSession}
        onChangeTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* 2. Main Central Viewport */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Top Header */}
        <Header
          currentModel={activeSession?.model || settings.defaultModel}
          onSelectModel={(model) => {
            if (activeSession) {
              setSessions((prev) =>
                prev.map((s) => (s.id === activeSession.id ? { ...s, model } : s))
              );
            }
            setSettings((prev) => ({ ...prev, defaultModel: model }));
          }}
          thinkingLevel={settings.thinkingLevel}
          onChangeThinkingLevel={(lvl) => setSettings((prev) => ({ ...prev, thinkingLevel: lvl }))}
          useWebSearch={settings.enableWebSearch}
          onToggleWebSearch={() =>
            setSettings((prev) => ({ ...prev, enableWebSearch: !prev.enableWebSearch }))
          }
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onToggleCanvas={() => setIsCanvasOpen(!isCanvasOpen)}
          isCanvasOpen={isCanvasOpen}
          onOpenVoiceCall={() => setActiveTab('voice-studio')}
          onShareChat={() => {
            if (activeSession) handleExportSession(activeSession);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Dynamic Center Stage Content */}
        <div className="flex-1 flex min-h-0 relative">
          {/* Tab 1: Chat Assistant */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col h-full min-w-0">
              <ChatView
                messages={activeSession ? activeSession.messages : []}
                isStreaming={isStreaming}
                onSendMessage={handleSendMessage}
                onRegenerate={handleRegenerate}
                onOpenInCanvas={handleOpenInCanvas}
                onOpenImageStudio={() => setActiveTab('image-studio')}
                onOpenVoiceStudio={() => setActiveTab('voice-studio')}
              />

              {/* Chat Input Bar */}
              <ChatInput
                onSendMessage={handleSendMessage}
                isStreaming={isStreaming}
                onStopStreaming={handleStopStreaming}
                useWebSearch={settings.enableWebSearch}
                onToggleWebSearch={() =>
                  setSettings((prev) => ({ ...prev, enableWebSearch: !prev.enableWebSearch }))
                }
                onOpenImageStudio={() => setActiveTab('image-studio')}
                isInstantFastMode={
                  (activeSession?.model || settings.defaultModel) === 'gemini-3.1-flash-lite' ||
                  settings.thinkingLevel === 'LOW'
                }
                onToggleInstantFastMode={() => {
                  const currentM = activeSession?.model || settings.defaultModel;
                  const newModel = currentM === 'gemini-3.1-flash-lite' ? 'gemini-3.8-flash' : 'gemini-3.1-flash-lite';
                  if (activeSession) {
                    setSessions((prev) =>
                      prev.map((s) => (s.id === activeSession.id ? { ...s, model: newModel } : s))
                    );
                  }
                  setSettings((prev) => ({
                    ...prev,
                    defaultModel: newModel,
                    thinkingLevel: 'LOW',
                  }));
                }}
              />
            </div>
          )}

          {/* Tab 2: Dedicated Image Studio */}
          {activeTab === 'image-studio' && (
            <ImageStudio
              images={images}
              onAddImage={(item) => setImages((prev) => [item, ...prev])}
              onDeleteImage={(id) => setImages((prev) => prev.filter((img) => img.id !== id))}
              onSendToChat={(prompt, imageUrl) => {
                setActiveTab('chat');
                handleSendMessage(`Let's discuss and iterate on this generated artwork: "${prompt}"\n\n![Image](${imageUrl})`);
              }}
            />
          )}

          {/* Tab 3: Dedicated Voice Studio */}
          {activeTab === 'voice-studio' && (
            <VoiceStudio
              items={voiceItems}
              onAddItem={(item) => setVoiceItems((prev) => [item, ...prev])}
              onDeleteItem={(id) => setVoiceItems((prev) => prev.filter((v) => v.id !== id))}
              onSendToChat={(text) => {
                setActiveTab('chat');
                handleSendMessage(text);
              }}
            />
          )}

          {/* Tab 4: Prompt Library Full View */}
          {activeTab === 'prompts' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <PromptLibraryModal
                isOpen={true}
                onClose={() => setActiveTab('chat')}
                onSelectPrompt={(prompt) => {
                  setActiveTab('chat');
                  handleSendMessage(prompt);
                }}
              />
            </div>
          )}

          {/* Tab 5: Canvas Full View (if opened via tab) */}
          {activeTab === 'canvas' && !isCanvasOpen && (
            <div className="flex-1 h-full">
              <CanvasWorkspace
                initialCode={canvasCode}
                initialLanguage={canvasLanguage}
                onClose={() => setActiveTab('chat')}
                onSendAICommand={handleSendCanvasCommand}
              />
            </div>
          )}

          {/* Side-by-side Canvas Split (if toggled while in chat) */}
          {isCanvasOpen && activeTab === 'chat' && (
            <CanvasWorkspace
              initialCode={canvasCode}
              initialLanguage={canvasLanguage}
              onClose={() => setIsCanvasOpen(false)}
              onSendAICommand={handleSendCanvasCommand}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <PromptLibraryModal
        isOpen={isPromptLibraryOpen}
        onClose={() => setIsPromptLibraryOpen(false)}
        onSelectPrompt={(prompt) => {
          setIsPromptLibraryOpen(false);
          handleSendMessage(prompt);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        sessions={sessions}
        onClearAllChats={() => {
          setSessions([]);
          setActiveSessionId(null);
          handleNewChat();
        }}
        onImportSessions={(imported) => {
          setSessions(imported);
          if (imported.length > 0) setActiveSessionId(imported[0].id);
        }}
      />
    </div>
  );
}
