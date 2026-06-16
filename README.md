# SciAssist — Scientific AI Coding Assistant

A professional, secure scientific AI assistant powered by **Groq API** (llama-3.3-70b-versatile), deployed on **Vercel** with a serverless proxy so the API key is never exposed to the browser.

## Security Architecture

```
Browser  →  /api/chat (Vercel Serverless)  →  Groq API
                       ↑
            GROQ_API_KEY stored in
            Vercel Environment Variables
            (never sent to client)
```

---

## Deploying to Vercel (Step-by-Step)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/sciassist.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Framework Preset: **Other**
4. Root Directory: leave as `/`
5. Click **Deploy** (it will fail — that's expected, you need the env var next)

### 3. Add the API Key as an Environment Variable

1. Go to your project on Vercel → **Settings → Environment Variables**
2. Add:
   - **Name:** `GROQ_API_KEY`
   - **Value:** `gsk_your_actual_key_here`
   - **Environment:** Production + Preview + Development
3. Click **Save**

### 4. Redeploy

Go to **Deployments → ⋯ → Redeploy**. Your app is now live and secure.

---

## Getting a Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up with email
3. Click **API Keys → Create API Key**
4. Copy the `gsk_...` key — shown once only

---

## Local Development

For local testing, Vercel's serverless functions don't run with plain `python -m http.server`. Use the Vercel CLI:

```bash
npm install -g vercel
vercel dev
```

This starts a local server at `http://localhost:3000` with the `/api/chat` function running, reading from `.env.local`.

Create `.env.local` (already gitignored):
```
GROQ_API_KEY=gsk_your_key_here
```

---

## File Structure

```
├── api/
│   └── chat.js          ← Serverless proxy (Groq key lives here only)
├── auth.html            ← Login / Register page
├── auth.css             ← Auth page styles
├── auth.js              ← Auth logic (SHA-256 hashed passwords in localStorage)
├── index.html           ← Main chat app (auth-guarded)
├── styles.css           ← Full design system
├── app.js               ← Chat application logic
├── favicon.svg
├── vercel.json          ← Routing + security headers
├── .env.local           ← Local dev keys (gitignored)
└── .gitignore
```

---

## Security Features

| Feature | Detail |
|---|---|
| API key never in browser | Stored only in Vercel env vars, used only in `/api/chat.js` |
| Rate limiting | 20 requests/IP/minute in the serverless function |
| Input sanitization | All message content is sanitized and length-capped before forwarding |
| Security headers | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| Auth guard | `index.html` redirects to `auth.html` if no session |
| Password hashing | SHA-256 via `crypto.subtle` before localStorage storage |
| Sanitized error messages | Raw Groq errors never forwarded to client |
