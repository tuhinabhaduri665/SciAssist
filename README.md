 HEAD
# SciAssist — Scientific AI Coding Assistant

A professional, browser-based scientific AI assistant powered by the **xAI Grok API**.

## Features

- **Scientific-only AI** — formulas (LaTeX), step-by-step reasoning, code solutions
- **Streaming responses** (Auto mode) or on-demand (Manual mode)
- **File attachments** — images, PDFs, documents, audio files (up to 10 MB)
- **Drag & drop** files onto the chat area
- **Voice input** — speech-to-text via Web Speech API
- **Voice output** — text-to-speech on any AI message
- **Math rendering** — KaTeX for inline ($...$) and block ($$...$$) LaTeX
- **Syntax highlighting** — Highlight.js for 20+ languages
- **Dark / Light theme** — auto-detected from system preference
- **Topic quick-access sidebar** — 12 scientific domains with starter prompts
- **Zero build step** — runs directly in any modern browser

## Setup

1. Open `index.html` in Chrome, Edge, or Firefox
2. Enter your **Grok API key** (starts with `xai-`) in the sidebar → **Save**
3. Start asking scientific questions!

## Getting a Grok API Key

1. Go to [https://console.x.ai](https://console.x.ai)
2. Sign in and create an API key
3. Paste it in the sidebar

## Supported Topics

| Domain | Examples |
|---|---|
| ⚛️ Atomic & Nuclear Physics | Radioactive decay, binding energy, fission |
| 🌌 Astrophysics | Schwarzschild radius, Hubble constant, CMB |
| 🛰️ Orbital Mechanics | Hohmann transfer, delta-v, orbital period |
| 🖼️ Digital Image Processing | Fourier transform, convolution, edge detection |
| 📊 Statistics | t-tests, ANOVA, Bayesian inference |
| ⚡ Electromagnetism | Maxwell's equations, circuit analysis |
| 🔬 Quantum Mechanics | Schrödinger equation, wavefunctions |
| 🧪 Chemistry | Thermochemistry, kinetics, spectroscopy |
| 🌡️ Thermodynamics | Carnot cycle, entropy, heat transfer |
| 🧬 Biology | Michaelis-Menten, genetic algorithms |
| 🌍 Earth Sciences | Seismology, climate modeling |
| 📋 Safety Data Sheets | GHS/MSDS, hazard codes |

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Enter` | Send message |
| `Shift+Enter` | New line in input |
| `Escape` | Stop generation |

## Files

```
index.html   — Main HTML structure
styles.css   — Full design system & layout
app.js       — All application logic
favicon.svg  — App icon
```

## Browser Support

- Chrome 88+ ✅
- Edge 88+ ✅
- Firefox 90+ ✅ (voice input limited)
- Safari 15+ ✅ (voice input limited)

> Voice input (speech-to-text) works best in Chrome and Edge.

# SciAssist
SciAssist is an AI-powered scientific and technical assistant that provides analytical insights, supports research workflows, and generates code solutions for complex computational tasks.
9804c7a8e210581072176a658118b0e794e4270e
