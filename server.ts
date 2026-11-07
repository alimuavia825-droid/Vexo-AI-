import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize shared Google GenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health & Config Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
    models: [
      { id: 'gemini-3.1-flash-lite', name: 'VEXO Lightning Instant', description: 'Zero-latency instantaneous millisecond engine (< 200ms)', default: true },
      { id: 'gemini-3.8-flash', name: 'VEXO 3.8 Flash', description: 'Deep multimodal reasoning & code generation' },
      { id: 'gemini-4-argon', name: 'VEXO 4 Argon Pro', description: 'Flagship deep STEM logic and complex architecture' },
    ],
  });
});

// Chat Streaming SSE Endpoint
app.post('/api/chat/stream', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      messages = [],
      model = 'gemini-3.1-flash-lite',
      systemInstruction = '',
      thinkingLevel = 'LOW',
      useSearch = false,
    } = req.body;

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(500).json({
        error: 'Neural core API key is not configured. Please add the API key in the Settings > Secrets panel.',
      });
      return;
    }

    // Set headers for Server-Sent Events with immediate no-buffering
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Crucial: prevents Nginx/Cloud Run from buffering chunks
    res.flushHeaders?.();

    // Trim context to last 10 messages for lightning-fast token generation
    const recentMessages = messages.slice(-10);
    const contents = recentMessages.map((m: any) => {
      const parts: any[] = [];

      // Add attached files / media
      if (Array.isArray(m.attachments) && m.attachments.length > 0) {
        for (const att of m.attachments) {
          if (att.base64 && att.mimeType) {
            const cleanBase64 = att.base64.replace(/^data:[^;]+;base64,/, '');
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: cleanBase64,
              },
            });
          }
        }
      }

      // Add text content
      if (typeof m.content === 'string' && m.content.trim()) {
        parts.push({ text: m.content });
      } else if (parts.length === 0) {
        parts.push({ text: ' ' });
      }

      return {
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts,
      };
    });

    // Model configuration optimized for millisecond replies
    const config: any = {};
    if (systemInstruction && systemInstruction.trim()) {
      config.systemInstruction = systemInstruction.trim();
    }

    // ALWAYS use gemini-3.1-flash-lite with MINIMAL thinking for millisecond replies
    // unless user explicitly selected gemini-4-argon (Flagship STEM)
    const selectedModel = model === 'gemini-4-argon' ? 'gemini-4-argon' : 'gemini-3.1-flash-lite';

    if (selectedModel === 'gemini-3.1-flash-lite') {
      // MINIMAL thinking eliminates the multi-second reasoning delay entirely!
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
    } else {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
    }

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    // Execute fast unary generation with zero thinking pause
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config,
    });

    const fullText = response.text || '';

    // Immediately dispatch words progressively so the UI streams in real-time
    const words = fullText.split(' ');
    for (let i = 0; i < words.length; i++) {
      const chunkText = (i === 0 ? '' : ' ') + words[i];
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('Chat stream error:', err);
    const errorMessage = err?.message || 'Error communicating with VEXO neural engine';
    if (!res.headersSent) {
      res.status(500).json({ error: errorMessage });
    } else {
      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      res.end();
    }
  }
});

// Non-streaming chat endpoint (for fallback or quick queries)
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      messages = [],
      model = 'gemini-3.8-flash',
      systemInstruction = '',
      thinkingLevel = 'MEDIUM',
      useSearch = false,
    } = req.body;

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(500).json({
        error: 'Neural core API key is not configured. Please add the API key in the Settings > Secrets panel.',
      });
      return;
    }

    const contents = messages.map((m: any) => {
      const parts: any[] = [];
      if (Array.isArray(m.attachments) && m.attachments.length > 0) {
        for (const att of m.attachments) {
          if (att.base64 && att.mimeType) {
            const cleanBase64 = att.base64.replace(/^data:[^;]+;base64,/, '');
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: cleanBase64,
              },
            });
          }
        }
      }
      if (typeof m.content === 'string' && m.content.trim()) {
        parts.push({ text: m.content });
      }
      return {
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts,
      };
    });

    const config: any = {};
    if (systemInstruction) config.systemInstruction = systemInstruction;
    const selectedModel = model === 'gemini-4-argon' ? 'gemini-4-argon' : 'gemini-3.1-flash-lite';
    if (selectedModel === 'gemini-3.1-flash-lite') {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
    } else {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
    }
    if (useSearch) config.tools = [{ googleSearch: {} }];

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config,
    });

    res.json({ text: response.text || '' });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err?.message || 'Failed to generate response' });
  }
});

// Image Generation Endpoint
app.post('/api/image/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, aspectRatio = '1:1', style = '', enhancePrompt = false } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    let finalPrompt = prompt;
    if (style && style !== 'none') {
      finalPrompt = `${prompt}, styled in ${style} aesthetic, highly detailed, masterwork quality, crisp focus`;
    }

    if (enhancePrompt) {
      try {
        const enhRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Enhance this user image prompt to be rich, visually descriptive, high-quality, and prompt-engineered for image generation. Keep it under 50 words. Only return the enhanced prompt without markdown or quotes.
Prompt: "${prompt}"`,
        });
        if (enhRes.text?.trim()) {
          finalPrompt = enhRes.text.trim();
        }
      } catch (e) {
        console.warn('Prompt enhancement fallback:', e);
      }
    }

    // Attempt generation with gemini-3.1-flash-lite-image
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: finalPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        },
      },
    });

    let foundImageUrl = '';
    let responseText = '';

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        foundImageUrl = `data:${mime};base64,${part.inlineData.data}`;
        break;
      } else if (part.text) {
        responseText += part.text;
      }
    }

    if (foundImageUrl) {
      res.json({
        imageUrl: foundImageUrl,
        prompt: finalPrompt,
        aspectRatio,
        style,
      });
      return;
    }

    // If model returned text instead of inlineData or paid key needed, provide informative error
    res.status(422).json({
      error: responseText || 'Image generation completed without inline image data. Please ensure your project has image generation access.',
    });
  } catch (err: any) {
    console.error('Image generation error:', err);
    res.status(500).json({
      error: err?.message || 'Failed to generate image. You can configure a billing-enabled API key in Settings > Secrets.',
    });
  }
});

// Voice TTS Endpoint (Text-to-Speech)
app.post('/api/voice/tts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, voiceName = 'Kore', style = '' } = req.body;

    if (!text) {
      res.status(400).json({ error: 'Text is required for TTS' });
      return;
    }

    // Limit text length to prevent huge latency
    const truncatedText = text.slice(0, 1200);

    const parts: any[] = [{ text: truncatedText }];
    if (style && style.trim()) {
      parts[0].speechMetadata = { style: style.trim() };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({
        audioUrl: `data:audio/wav;base64,${base64Audio}`,
        voiceName,
        style,
      });
    } else {
      res.status(500).json({ error: 'No audio data received from voice synthesis engine.' });
    }
  } catch (err: any) {
    console.error('TTS error:', err);
    res.status(500).json({
      error: err?.message || 'Failed to synthesize speech.',
    });
  }
});

// Audio Transcription Endpoint (Speech-to-Text)
app.post('/api/voice/transcribe', async (req: Request, res: Response): Promise<void> => {
  try {
    const { base64Audio, mimeType = 'audio/webm' } = req.body;

    if (!base64Audio) {
      res.status(400).json({ error: 'base64Audio is required' });
      return;
    }

    const cleanBase64 = base64Audio.replace(/^data:[^;]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'audio/webm',
              data: cleanBase64,
            },
          },
          {
            text: 'Transcribe the spoken audio accurately. Do not add timestamps or extra commentary, just the transcribed spoken text.',
          },
        ],
      },
    });

    res.json({ transcript: (response.text || '').trim() });
  } catch (err: any) {
    console.error('Transcription error:', err);
    res.status(500).json({
      error: err?.message || 'Failed to transcribe audio.',
    });
  }
});

// Setup Vite dev server or static file serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`VEXO-AI server running on http://0.0.0.0:${port} [${isProduction ? 'prod' : 'dev'}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
