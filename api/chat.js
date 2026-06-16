/* ============================================================
   SciAssist — Vercel Serverless Proxy
   /api/chat.js
   
   The Groq API key NEVER leaves this function.
   The browser only ever calls /api/chat on your own domain.
   ============================================================ */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

// Allowed origin — set to your Vercel domain in production
// '*' is safe here because the key is server-side only
const ALLOWED_METHODS = ['POST', 'OPTIONS'];

// Rate limiting — simple in-memory store per serverless instance
// (resets on cold start; sufficient for abuse prevention)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // max 20 requests per IP per minute

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  rateLimitMap.set(ip, entry);
  return false;
}

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    'unknown'
  );
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  // Method guard
  if (!ALLOWED_METHODS.includes(req.method)) {
    res.writeHead(405, { 'Content-Type': 'application/json', ...corsHeaders() });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // API key check — must be set in Vercel Environment Variables
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('GROQ_API_KEY environment variable is not set.');
    res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders() });
    res.end(JSON.stringify({ error: 'Server configuration error. Contact the administrator.' }));
    return;
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    res.writeHead(429, { 'Content-Type': 'application/json', ...corsHeaders() });
    res.end(JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }));
    return;
  }

  // Parse request body
  let body;
  try {
    body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
  } catch (_) {
    res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders() });
    res.end(JSON.stringify({ error: 'Invalid request body.' }));
    return;
  }

  // Validate messages array
  const { messages, stream = true } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders() });
    res.end(JSON.stringify({ error: 'messages array is required.' }));
    return;
  }

  // Sanitize messages — only allow role/content fields, strip anything else
  const sanitized = messages.map(m => ({
    role: ['system', 'user', 'assistant'].includes(m.role) ? m.role : 'user',
    content: typeof m.content === 'string'
      ? m.content.slice(0, 32000) // hard cap per message
      : Array.isArray(m.content)
        ? m.content.slice(0, 10).map(part => {
            if (part.type === 'text') return { type: 'text', text: String(part.text).slice(0, 32000) };
            if (part.type === 'image_url') return { type: 'image_url', image_url: { url: String(part.image_url?.url || '').slice(0, 2_000_000) } };
            return null;
          }).filter(Boolean)
        : String(m.content).slice(0, 32000),
  }));

  // Forward to Groq — streaming
  try {
    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,   // ← key never leaves the server
      },
      body: JSON.stringify({
        model: MODEL,
        messages: sanitized,
        stream: true,
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      let errMsg = `Groq API error (${groqRes.status})`;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.error?.message || errMsg;
      } catch (_) {}
      // Don't expose raw Groq errors to the client
      const safeMsg = groqRes.status === 429
        ? 'Rate limit reached. Please wait a moment.'
        : groqRes.status === 401
          ? 'API authentication error. Contact the administrator.'
          : 'The AI service is temporarily unavailable. Please try again.';
      res.writeHead(groqRes.status, { 'Content-Type': 'application/json', ...corsHeaders() });
      res.end(JSON.stringify({ error: safeMsg }));
      return;
    }

    // Pipe SSE stream back to client
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...corsHeaders(),
    });

    const reader = groqRes.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }

    res.end();

  } catch (err) {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json', ...corsHeaders() });
      res.end(JSON.stringify({ error: 'Failed to reach the AI service. Check your connection.' }));
    }
  }
}
