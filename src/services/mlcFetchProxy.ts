/**
 * Server-side proxy routing for local models downloads (to avoid CORS block).
 * Falls back to direct Hugging Face / CDN URLs when the API proxy is unavailable
 * (e.g. static SPA host returning index.html for /api/*).
 */

import { prebuiltAppConfig } from '@mlc-ai/web-llm';

export const MLC_FETCH_PATH = '/api/mlc-fetch';
export const MLC_HEALTH_PATH = '/api/mlc-health';

let proxyAvailableCache: boolean | null = null;

/** Returns true when same-origin /api/mlc-health responds with JSON (not SPA HTML). */
export async function isMlcProxyAvailable(force = false): Promise<boolean> {
  if (!force && proxyAvailableCache !== null) return proxyAvailableCache;

  if (typeof window === 'undefined') {
    proxyAvailableCache = true;
    return true;
  }

  try {
    const res = await fetch(`${window.location.origin}${MLC_HEALTH_PATH}`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      proxyAvailableCache = false;
      return false;
    }
    const body = await res.json();
    proxyAvailableCache = !!(body && (body as { ok?: boolean }).ok !== false);
    return proxyAvailableCache;
  } catch {
    proxyAvailableCache = false;
    return false;
  }
}

export async function fetchMlcUpstream(remoteUrl: string, upstreamMethod: 'GET' | 'HEAD' = 'GET') {
  if (typeof window !== 'undefined') {
    const proxyOk = await isMlcProxyAvailable();
    if (proxyOk) {
      return fetch(`${window.location.origin}${MLC_FETCH_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: remoteUrl, upstreamMethod }),
      });
    }
  }
  return fetch(remoteUrl, { method: upstreamMethod });
}

function buildModelList(useProxy: boolean): any[] {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const getProxyUrl = (rawUrl: string) =>
    useProxy ? `${origin}/api/proxy?url=${encodeURIComponent(rawUrl)}` : rawUrl;
  const getHfModelUrl = (repo: string) =>
    useProxy
      ? `${origin}/api/hf-proxy/${repo}/resolve/main/`
      : `https://huggingface.co/${repo}/resolve/main/`;

  const baseList = prebuiltAppConfig?.model_list || [];

  const proxiedList = baseList.map((item: any) => {
    let repo = 'mlc-ai/' + item.model_id;
    if (item.model) {
      const match = String(item.model).match(/huggingface\.co\/([^/]+\/[^/]+)/);
      if (match) {
        repo = match[1];
      } else if (!useProxy && typeof item.model === 'string' && item.model.startsWith('http')) {
        // Keep direct prebuilt URL when not proxying
        return {
          ...item,
          model_lib: item.model_lib ? getProxyUrl(item.model_lib) : undefined,
        };
      }
    }
    return {
      ...item,
      model: getHfModelUrl(repo),
      model_lib: item.model_lib ? getProxyUrl(item.model_lib) : undefined,
    };
  });

  const gemma2Special = proxiedList.find((item: any) => item.model_id === 'gemma-2b-it-q4f16_1-MLC');
  if (gemma2Special && !proxiedList.some((item: any) => item.model_id === 'gemma2-2b-it-webllm')) {
    proxiedList.push({
      ...gemma2Special,
      model_id: 'gemma2-2b-it-webllm',
    });
  }

  const coreRequiredModels = [
    {
      model_id: 'TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC',
      repo: 'mlc-ai/TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC',
      model_lib:
        'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_84/base/TinyLlama-1.1B-Chat-v1.0-q4f32_1_cs1k-webgpu.wasm',
    },
    {
      model_id: 'Phi-3.5-vision-instruct-q4f16_1-MLC',
      repo: 'mlc-ai/Phi-3.5-vision-instruct-q4f16_1-MLC',
      model_lib:
        'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_84/base/Phi-3.5-vision-instruct-q4f16_1_cs2k-webgpu.wasm',
    },
    {
      model_id: 'Phi-3.5-vision-instruct-q4f32_1-MLC',
      repo: 'mlc-ai/Phi-3.5-vision-instruct-q4f32_1-MLC',
      model_lib:
        'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_84/base/Phi-3.5-vision-instruct-q4f32_1_cs2k-webgpu.wasm',
    },
  ];

  coreRequiredModels.forEach((m) => {
    const existing = proxiedList.find((item: any) => item.model_id === m.model_id);
    if (existing) {
      existing.model = getHfModelUrl(m.repo);
      existing.model_lib = getProxyUrl(m.model_lib);
    } else {
      proxiedList.push({
        model_id: m.model_id,
        model: getHfModelUrl(m.repo),
        model_lib: getProxyUrl(m.model_lib),
        low_resource_required: m.model_id.includes('TinyLlama'),
      });
    }
  });

  return proxiedList;
}

export function getMlcAppConfig(useProxy = true): any {
  return {
    ...prebuiltAppConfig,
    model_list: buildModelList(useProxy),
  };
}

/** Probe proxy, then return a WebLLM appConfig that won't hit SPA HTML. */
export async function getMlcAppConfigSafe(): Promise<any> {
  const useProxy = await isMlcProxyAvailable();
  if (!useProxy) {
    console.warn(
      '[MLC] Model proxy unavailable — using direct Hugging Face URLs. Deploy the Cloudflare worker API (/api/*) for reliable CORS downloads.'
    );
  }
  return getMlcAppConfig(useProxy);
}
