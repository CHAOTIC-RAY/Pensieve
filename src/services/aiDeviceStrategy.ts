/**
 * Device-aware AI routing + optional AI.
 * When preference is `off`, enrichment uses Pensieve Brain (non-AI) only.
 */

import { AiStrategy, getAiStrategy, isLocalAiEnabled } from './localAiBackendLitert';

export function isLikelyMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true;
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

export function canRunLocalAiOnThisDevice(): boolean {
  if (!hasLocalAiHardwareHints()) return false;
  if (isLikelyMobileDevice()) return false;
  return true;
}

/** Effective compute path for enrichment */
export type EffectiveAiStrategy = 'brain' | 'local' | 'api_key';

export interface EffectiveAiInfo {
  preference: AiStrategy;
  effective: EffectiveAiStrategy;
  reason: string;
  localCapable: boolean;
  isMobile: boolean;
  aiEnabled: boolean;
}

export function getEffectiveAiInfo(): EffectiveAiInfo {
  const preference = getAiStrategy();
  const isMobile = isLikelyMobileDevice();
  const localCapable = canRunLocalAiOnThisDevice();

  if (preference === 'off') {
    return {
      preference,
      effective: 'brain',
      reason:
        'AI is off. Pensieve Brain indexes, tags, and classifies items locally with no models or API keys.',
      localCapable,
      isMobile,
      aiEnabled: false,
    };
  }

  if (preference === 'api_key') {
    return {
      preference,
      effective: 'api_key',
      reason: 'Using cloud API when online; Pensieve Brain covers offline / failures.',
      localCapable,
      isMobile,
      aiEnabled: true,
    };
  }

  // preference === 'local'
  if (isMobile) {
    return {
      preference,
      effective: 'api_key',
      reason:
        'Mobile — local WebGPU skipped. Cloud API when online; Brain otherwise. Desktop can still use local AI.',
      localCapable: false,
      isMobile,
      aiEnabled: true,
    };
  }

  if (!hasLocalAiHardwareHints()) {
    return {
      preference,
      effective: 'api_key',
      reason: 'WebGPU unavailable — cloud API when online, Pensieve Brain offline.',
      localCapable: false,
      isMobile,
      aiEnabled: true,
    };
  }

  return {
    preference,
    effective: isLocalAiEnabled() ? 'local' : 'brain',
    reason: 'Preferring local WebGPU on this desktop; Brain is the instant fallback.',
    localCapable: true,
    isMobile,
    aiEnabled: true,
  };
}

export function getEffectiveAiStrategy(): EffectiveAiStrategy {
  return getEffectiveAiInfo().effective;
}
