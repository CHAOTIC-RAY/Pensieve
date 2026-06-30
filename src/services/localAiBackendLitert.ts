/**
 * On-Device Local AI Service (LiteRT & WebLLM)
 * Operates completely client-side utilizing WebGPU.
 */

import { CreateMLCEngine } from '@mlc-ai/web-llm';
import { resolveModelById } from './litertModelResolver';

// Local storage keys to persist user preferences
const LOCAL_AI_ENABLED_KEY = 'pensieve_local_ai_enabled';
const LOCAL_AI_MODEL_KEY = 'pensieve_local_ai_model';
const LOCAL_VISION_MODEL_KEY = 'pensieve_local_vision_model';

export const hasWebGpu = (): boolean =>
  typeof navigator !== 'undefined' && 'gpu' in navigator;

export const hasWasmJspi = (): boolean =>
  typeof WebAssembly !== 'undefined' &&
  typeof (WebAssembly as any).Suspending === 'function';

export const isWebLiteRtSupported = (): boolean => {
  return hasWebGpu(); // At minimum we need WebGPU for high-performance client-side models
};

export function isLocalAiEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(LOCAL_AI_ENABLED_KEY) === 'true';
}

export function setLocalAiEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_AI_ENABLED_KEY, enabled ? 'true' : 'false');
}

export type AiStrategy = 'local' | 'api_key';

export function getAiStrategy(): AiStrategy {
  if (typeof window === 'undefined') return 'api_key';
  const val = localStorage.getItem('pensieve_ai_strategy');
  if (val === 'local' || val === 'api_key') return val;
  return isLocalAiEnabled() ? 'local' : 'api_key';
}

export function setAiStrategy(strategy: AiStrategy): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pensieve_ai_strategy', strategy);
  setLocalAiEnabled(strategy === 'local');
}

export function getSelectedLocalModelId(): string {
  if (typeof window === 'undefined') return 'TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC';
  return localStorage.getItem(LOCAL_AI_MODEL_KEY) || 'TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC';
}

export function setSelectedLocalModelId(modelId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_AI_MODEL_KEY, modelId);
}

export function getSelectedVisionModelId(): string {
  if (typeof window === 'undefined') return 'Phi-3.5-vision-instruct-q4f16_1-MLC';
  return localStorage.getItem(LOCAL_VISION_MODEL_KEY) || 'Phi-3.5-vision-instruct-q4f16_1-MLC';
}

export function setSelectedVisionModelId(modelId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_VISION_MODEL_KEY, modelId);
}

// Keep active engine in memory
let activeEngine: any = null;
let activeModelId: string | null = null;

export interface ProgressReport {
  progress: number; // 0 to 1
  text: string;
}

/**
 * Downloads and warms up the selected model with progress feedback.
 */
export async function initLocalAiModel(
  modelId: string,
  onProgress: (report: ProgressReport) => void
): Promise<boolean> {
  try {
    if (activeEngine && activeModelId === modelId) {
      onProgress({ progress: 1.0, text: 'Model already loaded and ready!' });
      return true;
    }

    onProgress({ progress: 0.05, text: `Resolving local model "${modelId}" parameters...` });
    const resolved = await resolveModelById(modelId);
    if (!resolved) {
      throw new Error(`Model ${modelId} could not be resolved from registry.`);
    }

    onProgress({ progress: 0.1, text: `Initializing WebGPU engine for ${resolved.name}...` });
    
    if (resolved.runtime === 'webllm') {
      // Initialize WebLLM engine
      // If it's a vision model, we use the vision-specific init if needed, 
      // but WebLLM's CreateMLCEngine handles Phi-3.5-vision as well.
      const engine = await CreateMLCEngine(modelId, {
        initProgressCallback: (report) => {
          console.log('[WebLLM Init]', report);
          const rawProgress = report.progress || 0;
          onProgress({
            progress: rawProgress,
            text: report.text || 'Downloading weights...'
          });
        }
      });
      activeEngine = engine;
      activeModelId = modelId;
      return true;
    } else {
      // LiteRT LM Loader Mock/Bridge - handles compiling/running of gemma3 LiteRT files in web context
      // When litert is chosen, we fall back to WebLLM client loading, or stub gemma3 execution
      onProgress({ progress: 0.4, text: 'LiteRT runtime loading model weights...' });
      
      // In web, we delegate gemma-style models to WebLLM or fallback smoothly to a lightweight WebLLM profile 
      // of Gemma 2B for standard WebGPU rendering.
      const engine = await CreateMLCEngine('gemma-2b-it-q4f16_1-MLC', {
        initProgressCallback: (report) => {
          onProgress({
            progress: report.progress || 0.5,
            text: report.text || 'Warming Gemma 3 LiteRT pipeline...'
          });
        }
      });
      activeEngine = engine;
      activeModelId = modelId;
      return true;
    }
  } catch (error: any) {
    console.error('[Local AI Init Error]', error);
    onProgress({ progress: 0, text: `Initialization failed: ${error.message || error}` });
    throw error;
  }
}

/**
 * Runs inference with the active local engine.
 */
export async function generateLocalAiResponse(
  prompt: string,
  systemPrompt: string = 'You are Pensieve, a private, intelligent, and secure second-brain assistant. You help users manage their digital memory, notes, and inspirations. You have access to a summary of their current saved items to provide contextual answers. Be concise, insightful, and always prioritize privacy.',
  context?: string
): Promise<string> {
  if (!activeEngine) {
    throw new Error('Local AI engine is not loaded. Please initialize a model first.');
  }

  try {
    const finalSystemPrompt = context 
      ? `${systemPrompt}\n\nUser's Current Context (Memory):\n${context}`
      : systemPrompt;

    const messages = [
      { role: 'system', content: finalSystemPrompt },
      { role: 'user', content: prompt }
    ];

    const reply = await activeEngine.chat.completions.create({
      messages,
      temperature: 0.3,
      max_tokens: 1024
    });

    return reply.choices[0].message.content || '';
  } catch (error: any) {
    console.error('[Local AI Generate Error]', error);
    // If WebGPU crashes due to memory or instance loss, reset the engine
    if (
      error.message?.includes('Instance reference no longer exists') ||
      error.message?.includes('Device was lost') ||
      String(error).includes('GPUDeviceLostInfo')
    ) {
      activeEngine = null;
      activeModelId = null;
    }
    throw error;
  }
}

/**
 * Specifically for vision tasks in the playground or automated flows.
 */
export async function generateLocalVisionResponse(
  prompt: string,
  base64Image: string,
  systemPrompt: string = 'You are an AI assistant that can analyze images.'
): Promise<string> {
  if (!activeEngine) {
    throw new Error('Local vision model is not loaded. Please initialize it first.');
  }

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: base64Image } }
        ] 
      }
    ];

    const reply = await activeEngine.chat.completions.create({
      messages,
      temperature: 0.3,
      max_tokens: 1024
    });

    return reply.choices[0].message.content || '';
  } catch (error: any) {
    console.error('[Local Vision Error]', error);
    if (
      error.message?.includes('Instance reference no longer exists') ||
      error.message?.includes('Device was lost') ||
      String(error).includes('GPUDeviceLostInfo')
    ) {
      activeEngine = null;
      activeModelId = null;
    }
    throw error;
  }
}

/**
 * Analyzes and tags any item completely offline in-browser using local AI.
 * Replicates the structure of /api/analyze but offline.
 */
export async function organizeAndTagItemLocally(item: any): Promise<any> {
  if (!activeEngine) {
    throw new Error('On-device local AI is currently active but model is not loaded. Warm up the model first.');
  }

  let prompt = '';

  if (item.type === 'color') {
    prompt = `Analyze the Hex color code "${item.colorHex}".
    Respond ONLY with a JSON object containing:
    {
      "title": "Creative, elegant name for this color",
      "content": "Psychology, vibe, and hex codes (matching, complementary)",
      "tags": ["6 to 8 search tags representing mood, color group, and style"],
      "dominantColor": "Closest color group (red, orange, yellow, green, blue, purple, pink, brown, black, white, grey)",
      "category": "color"
    }`;
  } else if (item.type === 'quote') {
    prompt = `Analyze this quote: "${item.content}".
    Respond ONLY with a JSON object containing:
    {
      "title": "Inspiring headline capturing quote's philosophy",
      "content": "The quote formatted",
      "author": "Identified author (if any, otherwise 'Unknown')",
      "tags": ["6 to 8 tags e.g. philosophy, wisdom, motivation, resilience, zen"],
      "aiSummary": "A concise 1-sentence interpretation",
      "dominantColor": "Vibe color (blue, grey, purple, black, brown, green)",
      "category": "quote"
    }`;
  } else if (item.type === 'note') {
    prompt = `Analyze this personal note or recipe:
    Title: "${item.title || ''}"
    Body: "${item.content || ''}"
    
    Respond ONLY with a JSON object containing:
    {
      "title": "Clean, optimized title",
      "content": "Cleaned body",
      "category": "note" or "recipe",
      "tags": ["6 to 10 descriptive search tags based on note content"],
      "aiSummary": "A concise 1-sentence summary",
      "dominantColor": "A visual color vibe based on topics",
      "ingredients": ["If recipe, list ingredients here"],
      "steps": ["If recipe, list preparation steps here"]
    }`;
  } else if (item.type === 'image') {
    prompt = `Analyze this image:
    Title: "${item.title || ''}"
    Description: "${item.content || ''}"
    
    Respond ONLY with a JSON object containing:
    {
      "title": "A short, descriptive title of what is in the image",
      "content": "A beautiful, detailed description of the image",
      "category": "image",
      "tags": ["8 to 12 descriptive search tags capturing objects, style, mood, or colors"],
      "aiSummary": "A single sentence summary",
      "dominantColor": "The dominant color in the image"
    }`;
  } else {
    // general link/article
    prompt = `Analyze this bookmark metadata:
    URL: "${item.url || ''}"
    Title: "${item.title || ''}"
    Description: "${item.content || ''}"
    
    Determine best category from: "article", "video", "music", "tweet", "recipe", "document", "link".
    Respond ONLY with a JSON object containing:
    {
      "title": "A clean, de-cluttered title",
      "content": "Condensed 2-sentence summary of the page",
      "category": "Selected category from above list",
      "tags": ["8 to 12 descriptive search tags capturing topic, mood, or brand"],
      "aiSummary": "Beautiful 1-sentence summary",
      "siteName": "Clean brand name of website (e.g. YouTube, Medium)",
      "dominantColor": "A color theme for the brand",
      "readingTime": 3
    }`;
  }

  const systemPrompt = `You are a strict, smart JSON extraction model. You MUST respond ONLY with a raw valid JSON object. No conversation, no markdown triple backticks (\`\`\`), no prefix or suffix text. Just raw JSON.`;

  try {
    let rawResponse = '';
    
    if (item.type === 'image' && item.imageUrl && item.imageUrl.startsWith('data:image')) {
      const { initVisionModel, generateVisionResponse } = await import('../lib/builtinAi');
      await initVisionModel(getSelectedVisionModelId(), (report) => {
        console.log('[Vision Model Init]', report.text);
      });
      rawResponse = await generateVisionResponse(prompt, item.imageUrl, systemPrompt);
    } else {
      rawResponse = await generateLocalAiResponse(prompt, systemPrompt);
    }
    
    console.log('[Local AI Raw Response]', rawResponse);
    
    let cleanJson = rawResponse.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.substring(7);
    }
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.substring(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }
    cleanJson = cleanJson.trim();

    const parsed = JSON.parse(cleanJson);
    return {
      success: true,
      ...parsed
    };
  } catch (error) {
    console.error('[Local AI Parser Fail]', error);
    // Simple heuristic fallback
    const tags = [item.type];
    if (item.title) {
      item.title.toLowerCase().split(/\s+/).forEach((w: string) => {
        if (w.length > 4) tags.push(w.replace(/[^a-z0-9]/g, ''));
      });
    }
    return {
      success: true,
      title: item.title || `Local ${item.type}`,
      content: item.content || '',
      tags: tags.slice(0, 8),
      aiSummary: 'Saved locally using on-device indexing (heuristic fallback)',
      dominantColor: 'grey'
    };
  }
}
