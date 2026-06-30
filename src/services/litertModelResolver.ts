/**
 * LiteRT & WebLLM Model Resolver Service
 * Resolves community model weights, paths, and repositories.
 */

export interface ModelManifestEntry {
  model_id: string;
  name: string;
  runtime: 'litert_lm' | 'webllm';
  litert_web: boolean;
  litert_community_repo?: string;
  litert_file?: string;
  power_tier: 'low' | 'balanced' | 'high';
  context_window_size: number;
  published: boolean;
}

export interface ResolvedModelArtifact {
  modelId: string;
  name: string;
  runtime: 'litert_lm' | 'webllm';
  repoUrl: string;
  fileName?: string;
  contextWindow: number;
}

export async function fetchModelManifest(): Promise<ModelManifestEntry[]> {
  try {
    const response = await fetch('/pensieve-models.manifest.json');
    if (!response.ok) {
      throw new Error('Failed to fetch local model manifest.');
    }
    const data = await response.json();
    return data.models || [];
  } catch (err) {
    console.warn('[Model Resolver] Failed to fetch manifest, falling back to static list.', err);
    return [
      {
        model_id: 'Phi-3.5-vision-instruct-q4f16_1-MLC',
        name: 'Phi-3.5 Vision (balanced) (3.9GB VRAM)',
        runtime: 'webllm',
        litert_web: false,
        litert_community_repo: 'mlc-ai',
        power_tier: 'balanced',
        context_window_size: 4096,
        published: true
      },
      {
        model_id: 'Phi-3.5-vision-instruct-q4f32_1-MLC',
        name: 'Phi-3.5 Vision (higher quality) (5.9GB VRAM)',
        runtime: 'webllm',
        litert_web: false,
        litert_community_repo: 'mlc-ai',
        power_tier: 'high',
        context_window_size: 4096,
        published: true
      },
      {
        model_id: 'gemma3-1b-it-litert',
        name: 'Gemma 3 1B IT (LiteRT Community Web)',
        runtime: 'litert_lm',
        litert_web: true,
        litert_community_repo: 'litert-community/Gemma3-1B-IT',
        litert_file: 'Gemma3-1B-IT_multi-prefill-seq_q4_ekv4096.litertlm',
        power_tier: 'balanced',
        context_window_size: 4096,
        published: true
      },
      {
        model_id: 'TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC',
        name: 'TinyLlama 1.1B Chat (Low Power WebGPU)',
        runtime: 'webllm',
        litert_web: false,
        litert_community_repo: 'mlc-ai',
        power_tier: 'low',
        context_window_size: 2048,
        published: true
      }
    ];
  }
}

export async function resolveModelById(modelId: string): Promise<ResolvedModelArtifact | null> {
  const models = await fetchModelManifest();
  const entry = models.find(m => m.model_id === modelId);
  if (!entry) return null;

  if (entry.runtime === 'litert_lm') {
    return {
      modelId: entry.model_id,
      name: entry.name,
      runtime: entry.runtime,
      repoUrl: `https://huggingface.co/${entry.litert_community_repo || 'litert-community/Gemma3-1B-IT'}`,
      fileName: entry.litert_file,
      contextWindow: entry.context_window_size
    };
  } else {
    return {
      modelId: entry.model_id,
      name: entry.name,
      runtime: entry.runtime,
      repoUrl: `https://huggingface.co/mlc-ai/${entry.model_id}`,
      contextWindow: entry.context_window_size
    };
  }
}
