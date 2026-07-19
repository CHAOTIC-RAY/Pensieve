/**
 * On-Launch Local AI Bootstrap & Status Monitor
 */

import { 
  isLocalAiEnabled, 
  getSelectedLocalModelId, 
  getSelectedVisionModelId,
  initLocalAiModel,
  ProgressReport
} from './localAiBackendLitert';
import { isLikelyMobileDevice } from './aiDeviceStrategy';

export type BootstrapPhase = 'idle' | 'unsupported' | 'downloading' | 'ready' | 'failed';

export interface BootstrapState {
  phase: BootstrapPhase;
  progress: number; // 0 to 1
  message: string;
}

// Global subscribers for loading notifications
type Subscriber = (state: BootstrapState) => void;
const subscribers = new Set<Subscriber>();

let currentStatus: BootstrapState = {
  phase: 'idle',
  progress: 0,
  message: ''
};

export function subscribeToBootstrap(callback: Subscriber): () => void {
  subscribers.add(callback);
  // Emit initial state
  callback(currentStatus);
  return () => {
    subscribers.delete(callback);
  };
}

let lastUpdate = 0;
function updateStatus(phase: BootstrapPhase, progress: number, message: string) {
  const now = Date.now();
  // Throttle updates to at most once every 100ms, unless phase changed or it's finished/failed
  if (phase === currentStatus.phase && phase === 'downloading' && now - lastUpdate < 100 && progress < 1) {
    return;
  }
  lastUpdate = now;
  currentStatus = { phase, progress, message };
  subscribers.forEach(sub => sub(currentStatus));
}

export function getCurrentBootstrapStatus(): BootstrapState {
  return currentStatus;
}

/**
 * Checks if the system should auto bootstrap.
 */
export function shouldAutoBootstrapLocalAi(): boolean {
  return isLocalAiEnabled();
}

/**
 * Validates WebGPU support.
 */
export async function checkWebGpuSupport(): Promise<string | null> {
  if (typeof window === 'undefined') return 'Not running in a browser context.';
  
  // WebLLM/MLC requires SharedArrayBuffer for high-performance multi-threaded inference
  if (typeof SharedArrayBuffer === 'undefined') {
    return 'Your browser has disabled high-performance multi-threading (SharedArrayBuffer). This usually occurs when security headers (COOP/COEP) are missing from the server.';
  }

  if (!('gpu' in navigator)) {
    return 'Your browser or device does not support WebGPU. Please use Chrome 113+ or Edge 113+ with hardware acceleration enabled.';
  }
  try {
    const adapter = await (navigator as any).gpu.requestAdapter();
    if (!adapter) {
      return 'WebGPU is present in browser but failed to find a compatible graphics hardware adapter.';
    }
  } catch (err: any) {
    return `WebGPU adapter error: ${err.message || err}`;
  }
  return null;
}

/**
 * Warms and downloads the selected model.
 */
export async function bootstrapLocalAiOnLaunch(force: boolean = false): Promise<void> {
  console.log(`[LocalAI Bootstrap] Launching (force=${force})...`);
  if (!force && !shouldAutoBootstrapLocalAi()) {
    console.log('[LocalAI Bootstrap] Auto-bootstrap skipped: local AI is disabled.');
    updateStatus('idle', 0, 'On-device local AI is currently disabled. Enable it in the settings.');
    return;
  }

  // Mobile: skip heavy WebLLM downloads — cloud API + vault sync is the cross-device path
  if (!force && isLikelyMobileDevice()) {
    updateStatus(
      'unsupported',
      0,
      'Mobile device — local WebGPU models stay on desktop. This device uses cloud API; enriched items sync through your vault (Appwrite/Supabase).'
    );
    return;
  }

  updateStatus('downloading', 0.02, 'Checking WebGPU support...');
  const gpuWarning = await checkWebGpuSupport();
  if (gpuWarning) {
    updateStatus('unsupported', 0, gpuWarning);
    return;
  }

  const modelId = getSelectedLocalModelId();
  const visionModelId = getSelectedVisionModelId();
  updateStatus('downloading', 0.05, `Loading local text model "${modelId}"...`);

  try {
    // 1. Initialize Local LLM Model (0.05 to 0.50 progress)
    await initLocalAiModel(modelId, (report: ProgressReport) => {
      const rawProgress = Math.max(0, Math.min(1, report.progress));
      const scaledProgress = 0.05 + rawProgress * 0.45; // scale to 0.05 - 0.50
      updateStatus('downloading', scaledProgress, `[Text Model] ${report.text}`);
    });

    // 2. Initialize Local Vision Model (0.50 to 0.95 progress)
    updateStatus('downloading', 0.50, `Loading local vision model "${visionModelId}"...`);
    const { initVisionModel } = await import('../lib/builtinAi');
    await initVisionModel(visionModelId, (report) => {
      const rawProgress = Math.max(0, Math.min(1, report.progress));
      const scaledProgress = 0.50 + rawProgress * 0.45; // scale to 0.50 - 0.95
      updateStatus('downloading', scaledProgress, `[Vision Model] ${report.text}`);
    });

    updateStatus('ready', 1.0, 'Both text & vision engines are fully warmed up and active!');
  } catch (err: any) {
    console.error('[Bootstrap Fail]', err);
    updateStatus('failed', 0, `Bootstrap failed: ${err.message || err}.`);
  }
}
