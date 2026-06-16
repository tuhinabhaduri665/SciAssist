# Scientific AI Coding Assistant — Technical Design

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (React SPA)                  │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Sidebar  │  │  Chat Panel  │  │   Input Toolbar   │  │
│  │ (Topics) │  │  (Messages)  │  │ (Text+Voice+Files)│  │
│  └──────────┘  └──────────────┘  └───────────────────┘  │
│                        │                                  │
│              ┌──────────────────┐                        │
│              │  ChatContext     │                        │
│              │  (State + API)   │                        │
│              └──────────────────┘                        │
│                        │                                  │
│              ┌──────────────────┐                        │
│              │   GrokService    │                        │
│              │ (fetch/SSE)      │                        │
│              └──────────────────┘                        │
└─────────────────────────────────────────────────────────┘
                         │
                    xAI Grok API
               https://api.x.ai/v1
```

## 2. Directory Structure

```
scientific-ai-assistant/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css               # Tailwind base + custom CSS vars
│   ├── types/
│   │   └── index.ts            # All shared TypeScript types
│   ├── constants/
│   │   ├── systemPrompt.ts     # Grok system prompt (scientific enforcer)
│   │   └── topics.ts           # Scientific topic categories
│   ├── context/
│   │   └── ChatContext.tsx     # Global state + dispatch
│   ├── services/
│   │   └── grokService.ts      # API calls (stream + complete)
│   ├── hooks/
│   │   ├── useVoice.ts         # Speech-to-text + TTS
│   │   └── useTheme.ts         # Dark/light theme toggle
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── chat/
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageContent.tsx  # Markdown + KaTeX + Code rendering
│   │   │   ├── TypingIndicator.tsx
│   │   │   └── WelcomeScreen.tsx
│   │   ├── input/
│   │   │   ├── InputArea.tsx
│   │   │   ├── AttachmentBar.tsx
│   │   │   ├── AttachmentPreview.tsx
│   │   │   └── ModeToggle.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Toast.tsx
│   │       ├── Tooltip.tsx
│   │       └── ThemeToggle.tsx
├── .env.example
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## 3. Data Models

```typescript
// types/index.ts

export type Role = 'user' | 'assistant' | 'system';
export type GenerationMode = 'auto' | 'manual';
export type Theme = 'light' | 'dark';

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'audio';
  mimeType: string;
  size: number;
  url: string;          // local object URL for preview
  base64?: string;      // for image payloads to Grok
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  attachments?: Attachment[];
  timestamp: Date;
  isStreaming?: boolean;
  isError?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  mode: GenerationMode;
  pendingGenerate: boolean;  // Manual mode: waiting for user to click Generate
  abortController: AbortController | null;
  error: string | null;
}
```

## 4. System Prompt Design

```typescript
// constants/systemPrompt.ts
export const SYSTEM_PROMPT = `
You are SciAssist — a highly specialized scientific AI coding assistant. 

Your role:
- Answer ONLY scientific and technical questions. Topics include but are not limited to: 
  physics (atomic, nuclear, quantum, classical, astrophysics), chemistry, biology, 
  mathematics, statistics, digital image processing, satellite engineering, orbital mechanics,
  safety data sheets (SDS/MSDS), thermodynamics, electromagnetism, fluid mechanics, 
  earth sciences, biochemistry, cosmology, and all STEM disciplines.
- For every scientific answer: provide relevant formulas (in LaTeX), step-by-step reasoning,
  deep conceptual explanation, and working code (Python preferred unless specified).
- Always format formulas as LaTeX: inline as $formula$ and block as $$formula$$.
- Always wrap code in fenced code blocks with language tags.

If a user asks something that is NOT scientific or technical:
- Politely decline and say: "I'm specialized in scientific topics only. Please ask me 
  something related to science, engineering, or mathematics."
- Do NOT engage with off-topic conversation, general chat, opinions on non-scientific 
  matters, creative writing, or anything outside STEM.

Tone: Professional, precise, educational, and engaging. Never condescending.
`;
```

## 5. Grok Service

```typescript
// services/grokService.ts

const BASE_URL = 'https://api.x.ai/v1';

// Stream mode (Auto)
export async function* streamGrokResponse(
  messages: GrokMessage[],
  apiKey: string,
  signal: AbortSignal
): AsyncGenerator<string> { ... }

// Complete mode (Manual)
export async function fetchGrokResponse(
  messages: GrokMessage[],
  apiKey: string,
  signal: AbortSignal
): Promise<string> { ... }
```

## 6. State Management (ChatContext)

```typescript
type Action =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'APPEND_STREAM'; payload: { id: string; chunk: string } }
  | { type: 'FINALIZE_STREAM'; payload: { id: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_MODE'; payload: GenerationMode }
  | { type: 'SET_PENDING_GENERATE'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ABORT'; payload: AbortController | null }
  | { type: 'CLEAR_CHAT' };
```

## 7. Voice Hook

```typescript
// hooks/useVoice.ts
export function useVoice() {
  // Speech-to-text via window.SpeechRecognition
  const startListening = () => { ... };
  const stopListening = () => { ... };
  
  // Text-to-speech via window.speechSynthesis
  const speak = (text: string) => { ... };
  const stopSpeaking = () => { ... };

  return {
    isListening,
    isSpeaking,
    transcript,
    isSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking
  };
}
```

## 8. UI Layout & Design Tokens

### Color Palette

| Token | Light | Dark |
|---|---|---|
| bg-primary | #F8F9FB | #0F1117 |
| bg-secondary | #FFFFFF | #1A1D27 |
| bg-sidebar | #EEF0F5 | #13151F |
| accent | #4F7FFA | #6B9BFF |
| text-primary | #1A1D2E | #E8EAED |
| text-secondary | #6B7280 | #9CA3AF |
| border | #E2E8F0 | #2A2D3A |
| success | #10B981 | #34D399 |
| error | #EF4444 | #F87171 |
| code-bg | #1E2130 | #1E2130 |

### Typography
- Font: `Inter` (UI) + `JetBrains Mono` (code)
- Base size: 14px / Line height: 1.6

### Layout
- Sidebar: 260px fixed width (collapsible on tablet)
- Chat panel: flex-grow, max-width 860px centered
- Input area: fixed at bottom with shadow separator

## 9. Component Behaviors

### MessageContent
Renders assistant messages through a pipeline:
1. `react-markdown` parses Markdown
2. `remark-math` extracts LaTeX expressions
3. `rehype-katex` renders LaTeX to HTML
4. `react-syntax-highlighter` renders code blocks with Prism theme
5. URL auto-link via `remark-gfm`

### InputArea
- Textarea auto-grows with content (max 180px)
- Shift+Enter = newline, Enter = send
- Attachment button opens file picker (multi-select supported)
- Mic button toggles voice listening
- Mode toggle pill (Auto | Manual)
- Send / Generate / Stop buttons based on state

### Sidebar
- Header: SciAssist logo + tagline
- Section: "Scientific Topics" — clickable chips that pre-fill a starter prompt
- Section: "New Chat" button
- Section: Theme toggle at bottom

## 10. Performance Strategy
- KaTeX renders synchronously — no layout shift
- Streaming tokens appended via direct DOM-adjacent state slice (no full re-render)
- Code highlighting is lazy — heavy syntax themes loaded only when code block detected
- Attachments processed via Web Workers when possible to avoid UI blocking
- `useMemo` and `useCallback` on all expensive render paths
