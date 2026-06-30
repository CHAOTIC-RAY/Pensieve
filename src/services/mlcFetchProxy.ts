/**
 * Server-side proxy routing for local models downloads (to avoid CORS block)
 */

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
