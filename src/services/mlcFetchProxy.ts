/**
 * Server-side proxy routing for local models downloads (to avoid CORS block)
 */

import { prebuiltAppConfig } from '@mlc-ai/web-llm';

export const MLC_FETCH_PATH = '/api/mlc-fetch';

export async function fetchMlcUpstream(remoteUrl: string, upstreamMethod: 'GET' | 'HEAD' = 'GET') {
  if (typeof window !== 'undefined') {
    return fetch(`${window.location.origin}${MLC_FETCH_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: remoteUrl, upstreamMethod }),
    });
  }
  return fetch(remoteUrl, { method: upstreamMethod });
}

export function getMlcAppConfig(): any {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const getProxyUrl = (rawUrl: string) => `${origin}/api/proxy?url=${encodeURIComponent(rawUrl)}`;
  const getHfProxyUrl = (repo: string) => `${origin}/api/hf-proxy/${repo}/resolve/main/`;

  // Base list initialized with prebuiltAppConfig's list
  const baseList = prebuiltAppConfig?.model_list || [];

  const proxiedList = baseList.map((item: any) => {
    let repo = 'mlc-ai/' + item.model_id;
    if (item.model) {
      const match = item.model.match(/huggingface\.co\/([^/]+\/[^/]+)/);
      if (match) {
        repo = match[1];
      }
    }
    return {
      ...item,
      model: getHfProxyUrl(repo),
      model_lib: item.model_lib ? getProxyUrl(item.model_lib) : undefined
    };
  });

  // Check if we need to add a custom fallback mapping for our specific model ID alias "gemma2-2b-it-webllm" 
  // used in pensieve-models.manifest.json
  const gemma2Special = proxiedList.find((item: any) => item.model_id === 'gemma-2b-it-q4f16_1-MLC');
  if (gemma2Special && !proxiedList.some((item: any) => item.model_id === 'gemma2-2b-it-webllm')) {
    proxiedList.push({
      ...gemma2Special,
      model_id: 'gemma2-2b-it-webllm'
    });
  }

  // Also verify that we have explicit overrides for the core models listed in the manifest just in case
  const coreRequiredModels = [
    {
      model_id: 'TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC',
      repo: 'mlc-ai/TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC',
      model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_84/base/TinyLlama-1.1B-Chat-v1.0-q4f32_1_cs1k-webgpu.wasm'
    },
    {
      model_id: 'Phi-3.5-vision-instruct-q4f16_1-MLC',
      repo: 'mlc-ai/Phi-3.5-vision-instruct-q4f16_1-MLC',
      model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_84/base/Phi-3.5-vision-instruct-q4f16_1_cs2k-webgpu.wasm'
    },
    {
      model_id: 'Phi-3.5-vision-instruct-q4f32_1-MLC',
      repo: 'mlc-ai/Phi-3.5-vision-instruct-q4f32_1-MLC',
      model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_84/base/Phi-3.5-vision-instruct-q4f32_1_cs2k-webgpu.wasm'
    }
  ];

  coreRequiredModels.forEach((m) => {
    if (!proxiedList.some((item: any) => item.model_id === m.model_id)) {
      proxiedList.push({
        model_id: m.model_id,
        model: getHfProxyUrl(m.repo),
        model_lib: getProxyUrl(m.model_lib),
        low_resource_required: m.model_id.includes('TinyLlama')
      });
    }
  });

  return {
    ...prebuiltAppConfig,
    model_list: proxiedList
  };
}
