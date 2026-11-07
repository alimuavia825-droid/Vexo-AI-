import React, { useState } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Download,
  Copy,
  Send,
  Wand2,
  Maximize2,
  RefreshCw,
  Palette,
  Ratio,
  Trash2,
} from 'lucide-react';
import { ImageGenerationItem } from '../types';

interface ImageStudioProps {
  images: ImageGenerationItem[];
  onAddImage: (item: ImageGenerationItem) => void;
  onDeleteImage: (id: string) => void;
  onSendToChat: (prompt: string, imageUrl: string) => void;
}

const STYLES = [
  { id: 'photorealistic', label: 'Photorealistic', description: '8K, Hasselblad lens, realistic lighting' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon', description: 'Futuristic city, neon lights, dark atmosphere' },
  { id: 'anime', label: 'Studio Anime', description: 'Vibrant hand-drawn anime aesthetic' },
  { id: '3d-render', label: '3D Pixar Render', description: 'Cute, vibrant, clay-like 3D character style' },
  { id: 'minimalist', label: 'Minimalist Vector', description: 'Clean geometric lines and flat modern palette' },
  { id: 'fantasy-oil', label: 'Dark Fantasy Oil', description: 'Rembrandt lighting, painterly textured brush' },
  { id: 'synthwave', label: 'Retro Synthwave', description: '1980s retro grids, sunset chrome and magenta' },
  { id: 'isometric', label: 'Isometric 3D', description: 'Miniature diorama, tilt-shift lens, sharp focus' },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square', icon: '■' },
  { id: '16:9', label: '16:9 Cinema', icon: '▬' },
  { id: '9:16', label: '9:16 Mobile', icon: '▮' },
  { id: '4:3', label: '4:3 Standard', icon: '▢' },
  { id: '3:4', label: '3:4 Portrait', icon: '▰' },
];

const SAMPLE_PROMPTS = [
  'A mystical neon fox in a futuristic bioluminescent forest, cinematic lighting, 8k',
  'An ultra-detailed steampunk airship floating through golden sunset clouds',
  'A cozy retro coffee shop interior in Kyoto during rain, anime watercolor style',
  'Futuristic glass computer workstation on a mountain terrace overlooking glaciers',
];

export const ImageStudio: React.FC<ImageStudioProps> = ({
  images,
  onAddImage,
  onDeleteImage,
  onSendToChat,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('photorealistic');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<ImageGenerationItem | null>(
    images.length > 0 ? images[0] : null
  );

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setError(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `You are an expert prompt engineer for AI image generators. Expand and enhance this image prompt into a rich, detailed, visually evocative prompt (under 50 words). Return ONLY the prompt text, no quotes or explanations.\n\nPrompt: ${prompt}`,
            },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          setPrompt(data.text.trim());
        }
      }
    } catch (e: any) {
      console.warn('Enhance prompt failed:', e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio: selectedRatio,
          style: selectedStyle,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      if (data.imageUrl) {
        const newItem: ImageGenerationItem = {
          id: `${Date.now()}-${Math.random()}`,
          prompt: prompt.trim(),
          style: selectedStyle,
          aspectRatio: selectedRatio,
          imageUrl: data.imageUrl,
          createdAt: Date.now(),
        };

        onAddImage(newItem);
        setCurrentResult(newItem);
      }
    } catch (e: any) {
      console.error('Image gen error:', e);
      setError(
        e.message ||
          'Image generation service encountered an error. If quota is limited, check Settings > Secrets.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-6xl mx-auto space-y-8">
      {/* Studio Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-[#121824] border border-purple-500/20 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-600/30">
            <Palette className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              VEXO Image Studio
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Generative visual studio powered by VEXO Neural Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>VEXO Vision v3</span>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Prompting Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Prompt Box */}
          <div className="p-5 rounded-2xl bg-[#121824] border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Visual Description Prompt
              </label>

              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !prompt.trim()}
                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 disabled:opacity-40 transition-colors font-medium"
              >
                <Wand2 className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
                <span>{isEnhancing ? 'Enhancing...' : 'Magic Prompt Enhance'}</span>
              </button>
            </div>

            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your vision: subject, mood, environment, lighting, details..."
              className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-purple-500/50 resize-none leading-relaxed"
            />

            {/* Quick Inspiration Chips */}
            <div>
              <span className="text-[11px] text-slate-500 mb-2 block">Quick Inspirations:</span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_PROMPTS.map((sp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(sp)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-colors truncate max-w-full"
                  >
                    {sp.slice(0, 40)}...
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Style Presets */}
          <div className="p-5 rounded-2xl bg-[#121824] border border-white/10 space-y-3 shadow-xl">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Aesthetic Style Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {STYLES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStyle(st.id)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    selectedStyle === st.id
                      ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-600/20'
                      : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <p className="font-semibold text-xs">{st.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{st.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="p-5 rounded-2xl bg-[#121824] border border-white/10 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Ratio className="w-3.5 h-3.5 text-purple-400" />
              <span>Aspect Ratio</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar.id}
                  type="button"
                  onClick={() => setSelectedRatio(ar.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    selectedRatio === ar.id
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                      : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-base">{ar.icon}</span>
                  <span>{ar.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-purple-600/30 transition-all disabled:opacity-50 active:scale-[0.99]"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Visual with VEXO...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Artwork</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {/* Right Column: Image Preview Canvas & Actions */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-[#121824] border border-white/10 shadow-xl flex flex-col items-center justify-center min-h-[420px]">
            {isGenerating ? (
              <div className="text-center p-8 space-y-4">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 border-t-purple-400 animate-spin" />
                  <div className="absolute inset-3 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 opacity-60 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Generating your vision</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    VEXO Neural Engine is crafting and rendering each detail...
                  </p>
                </div>
              </div>
            ) : currentResult ? (
              <div className="w-full space-y-4">
                <div className="relative group rounded-xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl">
                  <img
                    src={currentResult.imageUrl}
                    alt={currentResult.prompt}
                    className="w-full h-auto max-h-[480px] object-contain mx-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                    <p className="text-xs text-white line-clamp-2 font-medium">
                      {currentResult.prompt}
                    </p>
                  </div>
                </div>

                {/* Result Action Bar */}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={currentResult.imageUrl}
                      download={`vexo-ai-${Date.now()}.png`}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => onSendToChat(currentResult.prompt, currentResult.imageUrl)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 text-xs font-medium transition-colors"
                      title="Continue chatting about this image in chat assistant"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send to Chat</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono">
                    {currentResult.aspectRatio}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-slate-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30 text-purple-400" />
                <p className="text-sm font-medium text-slate-400">Ready to create</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Enter a prompt on the left and click Generate Artwork to synthesize images.
                </p>
              </div>
            )}
          </div>

          {/* Recent Gallery */}
          {images.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#121824] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recent Creations ({images.length})
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {images.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setCurrentResult(item)}
                    className={`group relative rounded-lg overflow-hidden cursor-pointer border aspect-square ${
                      currentResult?.id === item.id
                        ? 'border-purple-500 ring-2 ring-purple-500/30'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.prompt}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteImage(item.id);
                      }}
                      className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-slate-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
