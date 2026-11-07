export type Role = 'user' | 'assistant' | 'system';

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  mimeType: string;
  base64: string;
  previewUrl?: string;
  isText?: boolean;
  textContent?: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  attachments?: FileAttachment[];
  modelUsed?: string;
  isStreaming?: boolean;
  error?: string;
  reasoning?: string;
  isVoiceInput?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  pinned?: boolean;
  tags?: string[];
  systemPrompt?: string;
  model?: string;
}

export type ThemeMode = 'dark' | 'midnight' | 'cyber' | 'light';
export type ResponseTone = 'balanced' | 'concise' | 'detailed' | 'creative' | 'code-first';
export type ThinkingLevelOption = 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface AppSettings {
  theme: ThemeMode;
  defaultModel: string;
  thinkingLevel: ThinkingLevelOption;
  instantSpeedMode?: boolean;
  systemPersona: string;
  userInstructions: string;
  responseTone: ResponseTone;
  voiceSettings: {
    voiceName: string;
    speechRate: number;
    autoPlayVoice: boolean;
    speechStyle: string;
  };
  enableWebSearch: boolean;
  soundEffects: boolean;
}

export interface ImageGenerationItem {
  id: string;
  prompt: string;
  enhancedPrompt?: string;
  style: string;
  aspectRatio: string;
  imageUrl: string;
  createdAt: number;
}

export interface VoiceStudioItem {
  id: string;
  text: string;
  voiceName: string;
  audioUrl: string;
  createdAt: number;
  style?: string;
}

export type ActiveTab = 'chat' | 'image-studio' | 'voice-studio' | 'canvas' | 'prompts';
