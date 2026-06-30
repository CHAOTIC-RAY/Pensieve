/**
 * On-Launch Local AI Bootstrap & Status Monitor
 */

import { 
  isWebLiteRtSupported, 
  isLocalAiEnabled, 
  getSelectedLocalModelId, 
  initLocalAiModel,
  ProgressReport
} from './localAiBackendLitert';

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
  if (!force && !shouldAutoBootstrapLocalAi()) {
    updateStatus('idle', 0, 'On-device local AI is currently disabled. Enable it in the settings.');
    return;
  }

  updateStatus('downloading', 0.02, 'Checking WebGPU support...');
  const gpuWarning = await checkWebGpuSupport();
  if (gpuWarning) {
    updateStatus('unsupported', 0, gpuWarning);
    return;
  }

  const modelId = getSelectedLocalModelId();
  updateStatus('downloading', 0.05, `Loading local model "${modelId}"...`);

  try {
    await initLocalAiModel(modelId, (report: ProgressReport) => {
      // Normalize progress to prevent overshooting
      const normalizedProgress = Math.max(0, Math.min(1, report.progress));
      updateStatus('downloading', normalizedProgress, report.text);
    });
    updateStatus('ready', 1.0, 'Local AI Model is fully downloaded and running offline in-browser!');
  } catch (err: any) {
    console.error('[Bootstrap Fail]', err);
    updateStatus('failed', 0, `Bootstrap failed: ${err.message || err}.`);
  }
}
