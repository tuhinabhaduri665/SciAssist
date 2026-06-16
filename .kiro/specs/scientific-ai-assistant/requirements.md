# Scientific AI Coding Assistant — Requirements

## Overview
A web-based scientific AI coding assistant powered by the xAI Grok API. It functions as an intelligent chatbot that strictly handles scientific topics, providing mathematical formulas, deep reasoning, step-by-step explanations, and executable code solutions. The interface is professionally designed — clean, engaging, and performant.

---

## 1. Functional Requirements

### 1.1 Chatbot Interface
- REQ-001: Display a scrollable conversation thread with user and assistant message bubbles.
- REQ-002: Show a typing/streaming indicator while the assistant is generating a response.
- REQ-003: Auto-scroll to the latest message on new content arrival.
- REQ-004: Support message history within the session (no persistence required beyond refresh).
- REQ-005: Each assistant message must display a timestamp.
- REQ-006: User messages must display a timestamp and any attached file/audio previews.

### 1.2 Grok API Integration
- REQ-007: Integrate with xAI Grok API (`https://api.x.ai/v1`) using the `grok-3` or `grok-3-mini` model.
- REQ-008: Send conversation history as context with every request (multi-turn chat).
- REQ-009: Include a system prompt that enforces scientific-only responses and instructs the model to provide formulas, code, and deep explanations.
- REQ-010: Stream responses in Auto mode using Server-Sent Events (SSE) or chunked fetch.
- REQ-011: Fetch complete response in a single request in Manual mode.
- REQ-012: Handle API errors (rate limits, network failures, invalid key) gracefully with user-facing error messages.

### 1.3 Formula Rendering
- REQ-013: Render inline LaTeX math expressions using KaTeX (e.g., `$E = mc^2$`).
- REQ-014: Render block-level LaTeX equations in a centered, readable format.
- REQ-015: Formulas must not cause layout shift or flicker when rendered.

### 1.4 Code Blocks
- REQ-016: Detect fenced code blocks in assistant responses and render them with syntax highlighting.
- REQ-017: Display the programming language label on each code block.
- REQ-018: Provide a "Copy" button on each code block that copies the code to clipboard.
- REQ-019: Support at minimum: Python, C, C++, MATLAB, R, Julia, JavaScript, Bash.

### 1.5 Attachment Support
- REQ-020: Allow users to attach image files (PNG, JPG, JPEG, GIF, WEBP) via file picker or drag-and-drop.
- REQ-021: Allow users to attach document files (PDF, TXT, CSV, DOCX) for context.
- REQ-022: Allow users to attach audio files (MP3, WAV, OGG, M4A) for transcription.
- REQ-023: Show a thumbnail preview of attached images before sending.
- REQ-024: Show filename and file size for non-image attachments before sending.
- REQ-025: Allow users to remove an attachment before sending.
- REQ-026: Images sent with a message should be included in the API request as base64 or described as context to Grok.

### 1.6 Link Support
- REQ-027: Automatically detect and render URLs in assistant responses as clickable hyperlinks (opening in a new tab).
- REQ-028: Allow users to paste URLs in the input; they are sent as part of the message text.
- REQ-029: Display a subtle URL preview badge if a URL is present in the user's input.

### 1.7 Generation Modes
- REQ-030: Provide a toggle (Auto / Manual) in the UI, persistent for the session.
- REQ-031: **Auto mode**: response begins streaming immediately after the user sends a message.
- REQ-032: **Manual mode**: after sending, a "Generate" button appears; the assistant only responds when clicked.
- REQ-033: In Auto mode, show a "Stop" button to cancel an in-progress streamed response.
- REQ-034: The active generation mode must be clearly indicated in the UI at all times.

### 1.8 Voice Assistant
- REQ-035: Provide a microphone button in the input area for speech-to-text input using the Web Speech API.
- REQ-036: Display live transcription text in the input field as the user speaks.
- REQ-037: Finalize and submit (or populate) the input field when the user stops speaking.
- REQ-038: Provide a speaker/audio button on assistant messages to read the response aloud using the Web Speech Synthesis API.
- REQ-039: Show visual feedback (animated ring or pulsing icon) while the microphone is active.
- REQ-040: Handle microphone permission denial gracefully with a clear error message.

### 1.9 Scientific Topic Enforcement
- REQ-041: The system prompt must instruct Grok to refuse any non-scientific query.
- REQ-042: If a user submits an off-topic message, the assistant must respond with a polite, professional refusal explaining it only handles scientific topics, and suggest they rephrase if the question has a scientific angle.
- REQ-043: The refusal message must not be abrupt or dismissive — it should be helpful and redirecting.
- REQ-044: A client-side pre-filter may optionally flag obviously off-topic messages before API call.

### 1.10 Scientific Domains
The assistant must be competent (via system prompt guidance) across all of the following:
- REQ-045: Atomic & nuclear physics (nuclear reactions, decay, quantum numbers)
- REQ-046: Astrophysics & deep space (orbital mechanics, black holes, cosmology)
- REQ-047: Digital Image Processing (convolution, Fourier transforms, filters, segmentation)
- REQ-048: Satellite & aerospace engineering (trajectory calculations, probing missions, Hohmann transfers)
- REQ-049: Safety Data Sheets / chemical safety (MSDS structure, hazard classification, GHS)
- REQ-050: Statistical analysis (hypothesis testing, regression, distributions, ANOVA)
- REQ-051: Chemistry (reactions, stoichiometry, thermochemistry, spectroscopy)
- REQ-052: Biology & biochemistry (DNA, protein synthesis, enzyme kinetics)
- REQ-053: Earth & environmental sciences (geophysics, climate modeling, seismology)
- REQ-054: Thermodynamics & fluid mechanics (heat transfer, Navier-Stokes, entropy)
- REQ-055: Quantum mechanics (Schrödinger equation, operators, entanglement)
- REQ-056: Electromagnetism (Maxwell's equations, circuits, wave propagation)
- REQ-057: Mathematics (calculus, linear algebra, differential equations, number theory)

---

## 2. Non-Functional Requirements

### 2.1 Performance
- REQ-058: First meaningful paint under 1.5 seconds on a standard broadband connection.
- REQ-059: Streamed tokens must render without noticeable lag or jitter.
- REQ-060: File attachment processing must not block the UI thread.
- REQ-061: KaTeX rendering must complete before the message is considered fully visible.

### 2.2 Usability & UX
- REQ-062: The UI must be professionally attractive — clean typography, subtle color palette, well-spaced layout.
- REQ-063: Support both light and dark themes with a toggle; default to system preference.
- REQ-064: The interface must be engaging without being distracting (no animations that impede readability).
- REQ-065: Input area must support multi-line text with Shift+Enter for newlines and Enter to send.
- REQ-066: The assistant's name, "SciAssist", must be displayed prominently in the header.
- REQ-067: Provide a sidebar or panel listing scientific topic categories as quick-access prompts.

### 2.3 Accessibility
- REQ-068: All interactive elements must have ARIA labels.
- REQ-069: Keyboard navigation must work throughout (Tab, Enter, Escape).
- REQ-070: Color contrast must meet WCAG AA standards.
- REQ-071: Screen reader support for message content and interactive buttons.

### 2.4 Responsiveness
- REQ-072: Fully functional and readable on desktop (1280px+) and tablet (768px–1279px).
- REQ-073: Sidebar collapses to a slide-out drawer on tablet widths.

### 2.5 Error Handling
- REQ-074: Display inline error toasts for API failures without crashing the app.
- REQ-075: Unsupported file types must show a clear error and not be uploaded.
- REQ-076: If the browser doesn't support the Web Speech API, hide the voice buttons and show a tooltip explaining lack of support.
- REQ-077: Network disconnection must be detected and reported to the user.

### 2.6 Security
- REQ-078: The Grok API key must be stored in a `.env` file and never exposed in the client bundle in a production setup. For this implementation it will be held in a local env variable.
- REQ-079: File uploads must be validated client-side for type and size (max 10 MB per file).

---

## 3. Tech Stack

| Concern | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Math Rendering | KaTeX |
| Code Highlighting | Prism.js (via react-syntax-highlighter) |
| Voice | Web Speech API (browser-native) |
| AI API | xAI Grok API (REST/SSE) |
| State | React Context + useReducer |
| Icons | Lucide React |
| Markdown | react-markdown + remark-math + rehype-katex |

---

## 4. Out of Scope
- User authentication or accounts
- Persistent chat history across sessions
- Mobile (< 768px) optimization
- File storage or server-side file processing
- Custom fine-tuning of the Grok model
