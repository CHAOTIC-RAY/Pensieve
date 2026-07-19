/**
 * Device-aware AI routing: local WebGPU on capable desktops,
 * cloud API on mobile / unsupported GPUs. Analysis results sync via the vault.
 */

import { AiStrategy, getAiStrategy, isLocalAiEnabled } from './localAiBackendLitert';

export function isLikelyMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true;
  // iPadOS desktop UA still has touch
  if (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1) {
    return true;
  }
  return false;
}

export function hasLocalAiHardwareHints(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof SharedArrayBuffer === 'undefined') return false;
  if (!('gpu' in navigator)) return false;
  return true;
}

/** True when this device can realistically run WebLLM local models. */
export function canRunLocalAiOnThisDevice(): boolean {
  if (!hasLocalAiHardwareHints()) return false;
  // Mobile browsers almost never sustain useful WebGPU LLM inference
  if (isLikelyMobileDevice()) return false;
  return true;
}

export type EffectiveAiStrategy = AiStrategy;

export interface EffectiveAiInfo {
  preference: AiStrategy;
  effective: EffectiveAiStrategy;
  reason: string;
  localCapable: boolean;
  isMobile: boolean;
}

/**
 * Preference stays global (synced via settings QR).
 * Effective strategy is per-device so mobile always gets cloud/API when needed.
 */
export function getEffectiveAiInfo(): EffectiveAiInfo {
  const preference = getAiStrategy();
  const isMobile = isLikelyMobileDevice();
  const localCapable = canRunLocalAiOnThisDevice();

  if (preference !== 'local') {
    return {
      preference,
      effective: 'api_key',
      reason: 'Using cloud API as preferred.',
      localCapable,
      isMobile,
    };
  }

  if (isMobile) {
    return {
      preference,
      effective: 'api_key',
      reason:
        'Mobile device detected — local WebGPU models are limited here. Using cloud API; desktop-local results sync through your vault.',
      localCapable: false,
      isMobile,
    };
  }

  if (!hasLocalAiHardwareHints()) {
    return {
      preference,
      effective: 'api_key',
      reason:
        'WebGPU / SharedArrayBuffer unavailable — falling back to cloud API on this device.',
      localCapable: false,
      isMobile,
    };
  }

  return {
    preference,
    effective: isLocalAiEnabled() ? 'local' : 'api_key',
    reason: 'Preferring local WebGPU on this desktop; cloud API is the fallback.',
    localCapable: true,
    isMobile,
  };
}

export function getEffectiveAiStrategy(): EffectiveAiStrategy {
  return getEffectiveAiInfo().effective;
}
