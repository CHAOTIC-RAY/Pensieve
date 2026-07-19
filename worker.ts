/**
 * Cloudflare Worker — API routes for model CORS proxies.
 * Static SPA assets are served via Wrangler assets; /api/* runs worker-first.
 */

export interface Env {
  ASSETS?: Fetcher;
}

const UPSTREAM_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function corsHeaders(extra: HeadersInit = {}): Headers {
  const headers = new Headers(extra);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Range, Authorization'
  );
  headers.set(
    'Access-Control-Expose-Headers',
    'Content-Length, Content-Type, Content-Range, Accept-Ranges'
  );
  return headers;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders({ 'Content-Type': 'application/json' }),
  });
}

async function proxyUpstream(
  targetUrl: string,
  request: Request
): Promise<Response> {
  const headers: Record<string, string> = { 'User-Agent': UPSTREAM_UA };
  const range = request.headers.get('Range');
  if (range) headers.Range = range;

  const method = request.method === 'HEAD' ? 'HEAD' : 'GET';
  const upstream = await fetch(targetUrl, { method, headers });

  const outHeaders = corsHeaders();
  const contentType = upstream.headers.get('content-type');
  const contentLength = upstream.headers.get('content-length');
  const acceptRanges = upstream.headers.get('accept-ranges');
  const contentRange = upstream.headers.get('content-range');

  if (contentType) outHeaders.set('Content-Type', contentType);
  if (contentLength) outHeaders.set('Content-Length', contentLength);
  if (acceptRanges) outHeaders.set('Accept-Ranges', acceptRanges);
  if (contentRange) outHeaders.set('Content-Range', contentRange);

  return new Response(method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    headers: outHeaders,
  });
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (url.pathname === '/api/mlc-health') {
      return json({ ok: true, service: 'pensieve-mlc-proxy', runtime: 'cloudflare-worker' });
    }

    // /api/hf-proxy/<org>/<repo>/resolve/main/...
    if (url.pathname.startsWith('/api/hf-proxy/')) {
      const rest = url.pathname.slice('/api/hf-proxy/'.length);
      if (!rest) return json({ error: 'Missing Hugging Face path' }, 400);
      const targetUrl = `https://huggingface.co/${rest}${url.search}`;
      try {
        return await proxyUpstream(targetUrl, request);
      } catch (err: any) {
        return json({ error: err?.message || 'HF proxy failed' }, 502);
      }
    }

    // /api/proxy?url=<encoded>
    if (url.pathname === '/api/proxy') {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl) return json({ error: 'url parameter is required' }, 400);
      try {
        // Only allow known model hosts
        const parsed = new URL(targetUrl);
        const allowed =
          parsed.hostname.endsWith('huggingface.co') ||
          parsed.hostname.endsWith('hf.co') ||
          parsed.hostname === 'raw.githubusercontent.com' ||
          parsed.hostname.endsWith('github.io') ||
          parsed.hostname.endsWith('jsdelivr.net');
        if (!allowed) {
          return json({ error: 'Host not allowed for proxy' }, 403);
        }
        return await proxyUpstream(targetUrl, request);
      } catch (err: any) {
        return json({ error: err?.message || 'Proxy failed' }, 502);
      }
    }

    // /api/mlc-fetch  { url, upstreamMethod }
    if (url.pathname === '/api/mlc-fetch' && request.method === 'POST') {
      try {
        const body = (await request.json()) as {
          url?: string;
          upstreamMethod?: 'GET' | 'HEAD';
        };
        if (!body.url) return json({ error: 'URL is required' }, 400);
        const method = body.upstreamMethod === 'HEAD' ? 'HEAD' : 'GET';
        const synthetic = new Request(request.url, {
          method,
          headers: request.headers,
        });
        return await proxyUpstream(body.url, synthetic);
      } catch (err: any) {
        return json({ error: err?.message || 'MLC fetch failed' }, 502);
      }
    }

    // Non-API: defer to static assets when binding exists
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return json({ error: 'Not found' }, 404);
  },
};

export default worker;
