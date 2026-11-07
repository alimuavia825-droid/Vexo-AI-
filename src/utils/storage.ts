import { AppSettings, ChatSession, ImageGenerationItem, VoiceStudioItem } from '../types';

const STORAGE_KEYS = {
  SESSIONS: 'vexo_chat_sessions_v1',
  ACTIVE_SESSION_ID: 'vexo_active_session_id_v1',
  SETTINGS: 'vexo_settings_v1',
  IMAGES: 'vexo_images_v1',
  VOICE_ITEMS: 'vexo_voice_items_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  defaultModel: 'gemini-3.1-flash-lite',
  thinkingLevel: 'LOW',
  instantSpeedMode: true,
  systemPersona: 'You are VEXO-AI, an ultra-fast, high-intelligence AI platform. Provide immediate, accurate, crisp, and insightful answers in milliseconds without delay.',
  userInstructions: '',
  responseTone: 'balanced',
  voiceSettings: {
    voiceName: 'Kore',
    speechRate: 1.0,
    autoPlayVoice: false,
    speechStyle: 'Natural and conversational',
  },
  enableWebSearch: false,
  soundEffects: true,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    // Upgrade existing stored models and thinking levels to instant mode
    if (parsed.thinkingLevel === 'MEDIUM') {
      parsed.thinkingLevel = 'LOW';
    }
    if (parsed.defaultModel === 'gemini-3.8-flash') {
      parsed.defaultModel = 'gemini-3.1-flash-lite';
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.error('Failed to load settings:', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) return [];
    const sessions = JSON.parse(raw);
    return Array.isArray(sessions) ? sessions : [];
  } catch (e) {
    console.error('Failed to load sessions:', e);
    return [];
  }
}

export function saveSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions:', e);
  }
}

export function loadActiveSessionId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
  } catch (e) {
    return null;
  }
}

export function saveActiveSessionId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
    }
  } catch (e) {
    console.error('Failed to save active session ID:', e);
  }
}

export function loadSavedImages(): ImageGenerationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.IMAGES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveImages(items: ImageGenerationItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(items.slice(0, 50)));
  } catch (e) {
    console.error('Failed to save images:', e);
  }
}

export function loadVoiceItems(): VoiceStudioItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VOICE_ITEMS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveVoiceItems(items: VoiceStudioItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VOICE_ITEMS, JSON.stringify(items.slice(0, 30)));
  } catch (e) {
    console.error('Failed to save voice items:', e);
  }
}
