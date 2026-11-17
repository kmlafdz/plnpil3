/**
 * Cloudflare Worker Entrypoint untuk PLN Corpu Evaluasi Level 3
 * - Melayani aset statis frontend dari ./dist (binding ASSETS)
 * - Meneruskan seluruh permintaan /api/* ke backend server.js melalui Cloudflare Tunnel (BACKEND_API_URL)
 * - Atau melayani langsung via Hyperdrive jika env.HYPERDRIVE aktif
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Tangani request /api/*
    if (url.pathname.startsWith('/api/')) {
      // Prioritas A: Jika ada BACKEND_API_URL (Cloudflare Tunnel ke server.js di server Anda)
      if (env.BACKEND_API_URL) {
        const targetBase = env.BACKEND_API_URL.replace(/\/+$/, '');
        const targetUrl = `${targetBase}${url.pathname}${url.search}`;

        const proxyHeaders = new Headers(request.headers);
        proxyHeaders.set('X-Forwarded-Host', url.host);
        proxyHeaders.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

        const init = {
          method: request.method,
          headers: proxyHeaders,
          redirect: 'manual'
        };

        if (request.method !== 'GET' && request.method !== 'HEAD') {
          init.body = request.body;
        }

        try {
          return await fetch(targetUrl, init);
        } catch (fetchErr) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Gagal menghubungi backend di ${targetBase}. Pastikan node server.js dan Cloudflare Tunnel di server menyala. Detail: ${fetchErr.message}`
            }),
            { status: 502, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }
      }

      // Jika belum disetel
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Jembatan database belum aktif. Pastikan BACKEND_API_URL telah disetel ke URL Cloudflare Tunnel server Anda.'
        }),
        { status: 503, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // 2. Layani aset statis frontend & SPA fallback dari ./dist
    return env.ASSETS.fetch(request);
  }
};
