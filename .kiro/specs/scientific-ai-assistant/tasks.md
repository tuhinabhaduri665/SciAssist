# Scientific AI Coding Assistant — Implementation Tasks

## Task 1: Project Scaffold
- [ ] Initialize Vite + React + TypeScript project
- [ ] Install and configure Tailwind CSS
- [ ] Install dependencies: react-markdown, remark-math, rehype-katex, katex, react-syntax-highlighter, lucide-react, zustand or react-context
- [ ] Set up .env.example with VITE_GROK_API_KEY placeholder
- [ ] Configure tsconfig paths and Vite aliases
- [ ] Load Inter and JetBrains Mono fonts
- [ ] Define CSS custom properties (design tokens) in index.css

## Task 2: Types & Constants
- [ ] Define all TypeScript types in src/types/index.ts
- [ ] Write the Grok system prompt in src/constants/systemPrompt.ts
- [ ] Define scientific topic categories and starter prompts in src/constants/topics.ts

## Task 3: Grok Service Layer
- [ ] Implement streamGrokResponse (SSE/chunked fetch for Auto mode)
- [ ] Implement fetchGrokResponse (single request for Manual mode)
- [ ] Add request builder that formats messages including base64 image attachments
- [ ] Add error handling and typed error responses

## Task 4: State Management (ChatContext)
- [ ] Implement ChatContext with useReducer
- [ ] Implement all action handlers (ADD_MESSAGE, APPEND_STREAM, FINALIZE_STREAM, etc.)
- [ ] Implement sendMessage flow (handles both Auto and Manual modes)
- [ ] Implement abort/stop logic
- [ ] Expose context via useChatContext hook

## Task 5: Voice Hook
- [ ] Implement useVoice hook with Web Speech API speech-to-text
- [ ] Implement text-to-speech (speak / stopSpeaking)
- [ ] Handle browser support detection
- [ ] Handle microphone permission errors

## Task 6: Theme Hook
- [ ] Implement useTheme hook reading system preference
- [ ] Toggle dark/light class on document root
- [ ] Persist preference to localStorage

## Task 7: UI Components — Base
- [ ] Button component (variants: primary, ghost, icon)
- [ ] Toast notification component
- [ ] Tooltip component
- [ ] ThemeToggle component

## Task 8: Layout Components
- [ ] AppLayout (sidebar + main area flex container)
- [ ] Header (logo, mode indicator, clear chat button)
- [ ] Sidebar with topic chips and new chat button

## Task 9: Chat Components
- [ ] WelcomeScreen (shown when no messages)
- [ ] ChatPanel (scrollable message list + auto-scroll logic)
- [ ] TypingIndicator (animated dots)
- [ ] MessageBubble (user vs assistant styling)
- [ ] MessageContent (Markdown + KaTeX + code block pipeline)
- [ ] Code block with copy button
- [ ] Clickable URL links in messages
- [ ] TTS speaker button on assistant messages

## Task 10: Input Components
- [ ] InputArea (auto-grow textarea, Enter/Shift+Enter handling)
- [ ] AttachmentBar (file picker trigger, attachment preview list)
- [ ] AttachmentPreview (image thumbnail, file info badge, remove button)
- [ ] ModeToggle pill (Auto / Manual)
- [ ] Mic button with listening animation
- [ ] Send / Generate / Stop button logic

## Task 11: Integration & Wiring
- [ ] Connect InputArea → ChatContext.sendMessage
- [ ] Connect voice transcript → InputArea value
- [ ] Connect attachment files → message payload → Grok request
- [ ] Wire up Manual mode pending-generate state to Generate button
- [ ] Wire Stop button to AbortController

## Task 12: Polish & QA
- [ ] Verify KaTeX renders all formulas without layout shift
- [ ] Test streaming token rendering for smoothness
- [ ] Test off-topic message refusal (via system prompt)
- [ ] Test file upload validation (type + size)
- [ ] Test voice input and output
- [ ] Test dark/light theme toggle
- [ ] Test sidebar collapse on tablet
- [ ] ARIA labels and keyboard navigation check
- [ ] Error states: API failure, no mic, unsupported browser
