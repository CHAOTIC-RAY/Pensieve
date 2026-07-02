import { CreateMLCEngine } from '@mlc-ai/web-llm';
import { manageContextBudget } from './localAiContext';
import { getMlcAppConfig } from '../services/mlcFetchProxy';

let activeEngine: any = null;
let activeModelId: string | null = null;

export const hasWebGpu = (): boolean =>
  typeof navigator !== 'undefined' && 'gpu' in navigator;

export interface ProgressReport {
  progress: number;
  text: string;
}

export async function initVisionModel(
  modelId: string = 'Phi-3.5-vision-instruct-q4f16_1-MLC',
  onProgress: (report: ProgressReport) => void
): Promise<boolean> {
  if (!hasWebGpu()) {
    throw new Error('WebGPU is not supported by your browser.');
  }

  try {
    if (activeEngine && activeModelId === modelId) {
      onProgress({ progress: 1.0, text: 'Model already loaded and ready!' });
      return true;
    }

    onProgress({ progress: 0.1, text: `Initializing WebGPU engine for ${modelId}...` });
    
    // Phi-3.5-vision-instruct needs specific configuration or just normal engine init
    const engine = await CreateMLCEngine(
      modelId,
      {
        initProgressCallback: (report) => {
          onProgress({
            progress: report.progress || 0,
            text: report.text || 'Downloading weights...'
          });
        },
        appConfig: getMlcAppConfig()
      }
    );

    activeEngine = engine;
    activeModelId = modelId;
    return true;
  } catch (error: any) {
    console.error('[Builtin AI Init Error]', error);
    onProgress({ progress: 0, text: `Initialization failed: ${error.message || error}` });
    throw error;
  }
}

export async function generateVisionResponse(
  prompt: string,
  base64Image: string, // e.g. "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
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
    
    // Check context budget
    const safeMaxTokens = manageContextBudget(messages);

    const reply = await activeEngine.chat.completions.create({
      messages,
      temperature: 0.3,
      max_tokens: safeMaxTokens
    });

    return reply.choices[0].message.content || '';
  } catch (error: any) {
    console.error('[Builtin AI Generate Error]', error);
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
