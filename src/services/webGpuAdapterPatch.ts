/**
 * WebGPU Adapter Patching Layer
 * Detects device profiles and optimizes adapter constraints to ensure smooth Local AI inference.
 */

export interface WebGpuAdapterPatchOpts {
  patchMode?: 'auto' | 'compatibility' | 'low-power';
}

export type WebGpuAdapterProfile = 'auto' | 'compatibility' | 'low-power';

const isIosClient = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const shouldPreferCompatibilityFeatureLevel = (): boolean => {
  if (typeof window === 'undefined') return false;
  // Fallback heuristic for older/integrated GPUs or mobile devices
  return /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const shouldPreferMobileLowPowerFirst = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad/i.test(navigator.userAgent);
};

export const buildAdapterRequestOptions = (profile: WebGpuAdapterProfile) => {
  switch (profile) {
    case 'compatibility':
      return { featureLevel: 'compatibility', powerPreference: 'low-power' };
    case 'low-power':
      return { powerPreference: 'low-power' };
    case 'auto':
    default:
      if (shouldPreferCompatibilityFeatureLevel()) {
        return { featureLevel: 'compatibility', powerPreference: 'low-power' };
      }
      if (isIosClient() || shouldPreferMobileLowPowerFirst()) {
        return { powerPreference: 'low-power' };
      }
      return { powerPreference: 'high-performance' };
  }
};

/**
 * Wraps adapter limits to ensure they align with WebLLM/MLC requirements.
 */
function wrapAdapterWithMlcDeviceLimits(adapter: any): any {
  // We can return a proxied or slightly adjusted adapter or limits if needed.
  // Generally, returning the adapter directly is sufficient, but we can log / debug here.
  return adapter;
}

export function installWebGpuAdapterPreferencePatch(opts: WebGpuAdapterPatchOpts = {}): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  const gpu = (navigator as any).gpu;
  if (!gpu || !gpu.requestAdapter) return;

  const patchMode = opts.patchMode || 'auto';
  const origRequestAdapter = gpu.requestAdapter.bind(gpu);

  gpu.requestAdapter = async (options?: any) => {
    const profileOpts = buildAdapterRequestOptions(patchMode);
    console.log('[WebGPU Patch] Requesting GPU adapter with settings:', { ...options, ...profileOpts });
    const adapter = await origRequestAdapter({ ...options, ...profileOpts });
    return adapter ? wrapAdapterWithMlcDeviceLimits(adapter) : null;
  };
}
