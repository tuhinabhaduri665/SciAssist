/* ============================================================
   SciAssist — Scientific AI Coding Assistant
   Main Application
   ============================================================ */

'use strict';

/* ---- Constants ---- */
const GROK_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/png','image/jpeg','image/jpg','image/gif','image/webp'];
const ALLOWED_DOC_TYPES = ['application/pdf','text/plain','text/csv','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg','audio/wav','audio/ogg','audio/mp4','audio/m4a'];

const SYSTEM_PROMPT = `You are SciAssist — a highly specialized scientific AI coding assistant built for scientists, engineers, and researchers.

Your ONLY domain is science and technology. This strictly includes:
- Physics (atomic, nuclear, quantum, classical, astrophysics, optics, thermodynamics, electromagnetism, fluid mechanics, relativity)
- Chemistry (organic, inorganic, physical, analytical, spectroscopy, thermochemistry, reactions, stoichiometry)
- Biology and biochemistry (molecular biology, genetics, enzyme kinetics, physiology, ecology, microbiology)
- Mathematics (calculus, linear algebra, differential equations, number theory, statistics, probability, discrete math)
- Engineering (electrical, mechanical, civil, aerospace, chemical, software, systems)
- Computer Science and algorithms (data structures, complexity, AI/ML theory, numerical methods)
- Digital Image Processing (convolution, filtering, Fourier transforms, segmentation, morphology, compression)
- Astrophysics and cosmology (orbital mechanics, black holes, galaxy formation, dark matter, gravitational waves)
- Satellite and aerospace engineering (trajectory calculations, Hohmann transfers, probing missions, re-entry mechanics)
- Safety Data Sheets / Chemical Safety (MSDS, GHS classification, hazard codes, exposure limits)
- Earth sciences (geophysics, seismology, oceanography, atmospheric science, climate modeling)
- Statistical analysis and data science (hypothesis testing, regression, ANOVA, Bayesian inference, distributions)

For EVERY answer:
1. State the key formula(s) in LaTeX — inline as $formula$ and block as $$formula$$
2. Provide step-by-step derivation or reasoning
3. Give a deep conceptual explanation
4. Provide working code (Python preferred unless another language is requested)
5. Format code in fenced code blocks with language tags, e.g. \`\`\`python

If the question is NOT scientific, technical, or mathematical — respond EXACTLY with:
"I'm specialized in scientific and technical topics only. Please ask me something related to science, engineering, mathematics, or technology. If your question has a scientific angle, try rephrasing it with that focus."

Do not engage with: general chat, opinions on non-scientific topics, creative writing, personal advice, or anything outside STEM.

Tone: Professional, precise, educational, and genuinely engaging. Use clear terminology with explanations for complex terms. Never condescending.`;

const TOPICS = [
  { icon: '⚛️', label: 'Atomic & Nuclear Physics', prompt: 'Explain nuclear fission and derive the binding energy formula with a code to calculate Q-value.' },
  { icon: '🌌', label: 'Astrophysics & Cosmology', prompt: 'Derive the Schwarzschild radius of a black hole and write Python code to calculate it for any mass.' },
  { icon: '🛰️', label: 'Orbital Mechanics', prompt: 'Explain Hohmann transfer orbits. Derive the delta-v equations and simulate in Python.' },
  { icon: '🖼️', label: 'Digital Image Processing', prompt: 'Explain 2D Gaussian blur convolution mathematically and implement it in Python using NumPy.' },
  { icon: '📊', label: 'Statistical Analysis', prompt: 'Derive the t-test statistic and implement a two-sample t-test in Python with visualization.' },
  { icon: '⚡', label: 'Electromagnetism', prompt: "Derive Maxwell's equations in integral and differential form. Explain each physically." },
  { icon: '🔬', label: 'Quantum Mechanics', prompt: 'Solve the time-independent Schrödinger equation for a particle in a box numerically in Python.' },
  { icon: '🧪', label: 'Chemistry', prompt: 'Calculate the equilibrium constant Kp from thermodynamic data (ΔG, ΔH, ΔS) and provide Python code.' },
  { icon: '🌡️', label: 'Thermodynamics', prompt: 'Derive the Carnot efficiency and simulate a Carnot cycle (P-V diagram) in Python.' },
  { icon: '🧬', label: 'Biology & Biochemistry', prompt: 'Derive the Michaelis-Menten equation and fit experimental enzyme kinetics data in Python.' },
  { icon: '🌍', label: 'Earth Sciences', prompt: 'Explain seismic wave propagation and write Python code to analyze seismograph data.' },
  { icon: '📋', label: 'Safety Data Sheets', prompt: 'Explain the GHS hazard classification system for chemical safety data sheets (SDS/MSDS) with examples.' },
];

const WELCOME_CHIPS = [
  'Derive Schrödinger equation →',
  'Simulate orbital mechanics →',
  'Fourier transform in Python →',
  'Black hole radius calculation →',
  'Statistical hypothesis testing →',
  'Maxwell\'s equations explained →',
];

/* ---- State ---- */
let state = {
  messages: [],          // { id, role, content, attachments, timestamp, isError }
  isLoading: false,
  mode: 'auto',          // 'auto' | 'manual'
  pendingGenerate: false,
  abortController: null,
  apiKey: '',
  isSpeaking: false,
  isListening: false,
  speechRecognition: null,
  pendingAttachments: [],// { id, name, type, mimeType, size, dataUrl, file }
};

/* ---- DOM Refs ---- */
const $ = id => document.getElementById(id);
const sidebar = $('sidebar');
const sidebarToggle = $('sidebarToggle');
const sidebarClose = $('sidebarClose');
const sidebarOverlay = $('sidebarOverlay');
const newChatBtn = $('newChatBtn');
const topicsList = $('topicsList');
const themeToggle = $('themeToggle');
const themeLabel = $('themeLabel');
const apiKeyInput = $('apiKeyInput');
const saveApiKey = $('saveApiKey');
const modeAuto = $('modeAuto');
const modeManual = $('modeManual');
const clearChatBtn = $('clearChatBtn');
const chatPanel = $('chatPanel');
const welcomeScreen = $('welcomeScreen');
const welcomeChips = $('welcomeChips');
const messageList = $('messageList');
const typingIndicator = $('typingIndicator');
const attachmentBar = $('attachmentBar');
const generateBanner = $('generateBanner');
const generateBtn = $('generateBtn');
const inputRow = document.querySelector('.input-row');
const attachBtn = $('attachBtn');
const fileInput = $('fileInput');
const messageInput = $('messageInput');
const micBtn = $('micBtn');
const sendBtn = $('sendBtn');
const sendIcon = $('sendIcon');
const stopIcon = $('stopIcon');
const toastContainer = $('toastContainer');

/* ---- Init ---- */
function init() {
  loadTheme();
  loadApiKey();
  loadUserInfo();
  buildTopics();
  buildWelcomeChips();
  bindEvents();
}

/* ---- User Info ---- */
function loadUserInfo() {
  try {
    const sess = JSON.parse(sessionStorage.getItem('sciassist-session') || 'null')
      || JSON.parse(localStorage.getItem('sciassist-session') || 'null');
    if (!sess) return;
    const nameEl = document.getElementById('userName');
    const emailEl = document.getElementById('userEmail');
    const avatarEl = document.getElementById('userAvatarSm');
    if (nameEl) nameEl.textContent = `${sess.firstName} ${sess.lastName}`;
    if (emailEl) emailEl.textContent = sess.email;
    if (avatarEl) avatarEl.textContent = (sess.firstName?.[0] || 'U').toUpperCase();
  } catch (_) {}
}

function logout() {
  sessionStorage.removeItem('sciassist-session');
  localStorage.removeItem('sciassist-session');
  window.location.href = 'auth.html';
}
function loadTheme() {
  const saved = localStorage.getItem('sciassist-theme');
  const preferred = saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  applyTheme(preferred);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeLabel.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
  localStorage.setItem('sciassist-theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* ---- API Key ---- */
function loadApiKey() {
  const saved = localStorage.getItem('sciassist-apikey');
  // Clear any old xai- key from previous Grok setup
  if (saved && saved.startsWith('xai-')) {
    localStorage.removeItem('sciassist-apikey');
    return;
  }
  if (saved) {
    state.apiKey = saved;
    apiKeyInput.value = saved;
  }
}

function saveKey() {
  const val = apiKeyInput.value.trim();
  if (!val) { showToast('Please enter your Groq API key.', 'warning'); return; }
  if (!val.startsWith('gsk_')) { showToast('Groq API keys start with "gsk_". Please check your key.', 'warning'); return; }
  state.apiKey = val;
  localStorage.setItem('sciassist-apikey', val);
  showToast('API key saved!', 'success');
}

/* ---- Topics Sidebar ---- */
function buildTopics() {
  topicsList.innerHTML = '';
  TOPICS.forEach(topic => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'topic-item';
    btn.setAttribute('aria-label', `Ask about ${topic.label}`);
    btn.innerHTML = `<span class="topic-icon" aria-hidden="true">${topic.icon}</span>${topic.label}`;
    btn.addEventListener('click', () => {
      messageInput.value = topic.prompt;
      autoResizeTextarea();
      messageInput.focus();
      if (window.innerWidth <= 900) closeSidebar();
    });
    li.appendChild(btn);
    topicsList.appendChild(li);
  });
}

/* ---- Welcome Chips ---- */
function buildWelcomeChips() {
  welcomeChips.innerHTML = '';
  WELCOME_CHIPS.forEach(chip => {
    const btn = document.createElement('button');
    btn.className = 'welcome-chip';
    btn.textContent = chip;
    btn.addEventListener('click', () => {
      const prompt = chip.replace(' →', '');
      messageInput.value = prompt;
      autoResizeTextarea();
      messageInput.focus();
    });
    welcomeChips.appendChild(btn);
  });
}

/* ---- Sidebar ---- */
function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('visible');
  sidebarOverlay.setAttribute('aria-hidden', 'false');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('visible');
  sidebarOverlay.setAttribute('aria-hidden', 'true');
}

function toggleSidebar() {
  if (window.innerWidth > 900) {
    sidebar.classList.toggle('collapsed');
  } else {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  }
}

/* ---- Mode ---- */
function setMode(mode) {
  state.mode = mode;
  modeAuto.classList.toggle('active', mode === 'auto');
  modeManual.classList.toggle('active', mode === 'manual');
  modeAuto.setAttribute('aria-pressed', String(mode === 'auto'));
  modeManual.setAttribute('aria-pressed', String(mode === 'manual'));
}

/* ---- Event Bindings ---- */
function bindEvents() {
  sidebarToggle.addEventListener('click', toggleSidebar);
  sidebarClose.addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);
  newChatBtn.addEventListener('click', clearChat);
  themeToggle.addEventListener('click', toggleTheme);
  saveApiKey.addEventListener('click', saveKey);
  apiKeyInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveKey(); });
  modeAuto.addEventListener('click', () => setMode('auto'));
  modeManual.addEventListener('click', () => setMode('manual'));
  clearChatBtn.addEventListener('click', clearChat);
  attachBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);
  messageInput.addEventListener('input', autoResizeTextarea);
  messageInput.addEventListener('keydown', handleInputKeydown);
  sendBtn.addEventListener('click', handleSendOrStop);
  micBtn.addEventListener('click', toggleMic);
  generateBtn.addEventListener('click', generateResponse);
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
}

/* ---- Textarea auto-resize ---- */
function autoResizeTextarea() {
  messageInput.style.height = 'auto';
  const maxH = 180;
  messageInput.style.height = Math.min(messageInput.scrollHeight, maxH) + 'px';
}

/* ---- File Handling ---- */
function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  files.forEach(file => processFile(file));
  fileInput.value = ''; // reset so same file can be re-selected
}

function processFile(file) {
  if (file.size > MAX_FILE_SIZE) {
    showToast(`${file.name} exceeds 10MB limit.`, 'error');
    return;
  }
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isDoc = ALLOWED_DOC_TYPES.includes(file.type);
  const isAudio = ALLOWED_AUDIO_TYPES.includes(file.type) || file.name.endsWith('.m4a');
  if (!isImage && !isDoc && !isAudio) {
    showToast(`Unsupported file type: ${file.type || file.name}`, 'error');
    return;
  }
  const id = `att-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const type = isImage ? 'image' : isAudio ? 'audio' : 'document';
  const reader = new FileReader();
  reader.onload = (ev) => {
    const attachment = { id, name: file.name, type, mimeType: file.type, size: file.size, dataUrl: ev.target.result, file };
    state.pendingAttachments.push(attachment);
    renderAttachmentBar();
    if (isAudio) transcribeAudioFile(attachment);
  };
  reader.readAsDataURL(file);
}

function renderAttachmentBar() {
  if (state.pendingAttachments.length === 0) {
    attachmentBar.hidden = true;
    attachmentBar.innerHTML = '';
    return;
  }
  attachmentBar.hidden = false;
  attachmentBar.innerHTML = '';
  state.pendingAttachments.forEach(att => {
    const div = document.createElement('div');
    div.className = 'attachment-preview';
    div.setAttribute('data-id', att.id);
    if (att.type === 'image') {
      div.innerHTML = `<img src="${att.dataUrl}" alt="${att.name}" />`;
    } else {
      const iconSvg = att.type === 'audio'
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
      div.innerHTML = `<div class="attach-icon">${iconSvg}</div>`;
    }
    const info = document.createElement('div');
    info.className = 'attach-info';
    info.innerHTML = `<span class="attach-name" title="${att.name}">${att.name}</span>
      <span class="attach-size">${formatBytes(att.size)}</span>`;
    div.appendChild(info);
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-attach';
    removeBtn.setAttribute('aria-label', `Remove ${att.name}`);
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => removeAttachment(att.id));
    div.appendChild(removeBtn);
    attachmentBar.appendChild(div);
  });
}

function removeAttachment(id) {
  state.pendingAttachments = state.pendingAttachments.filter(a => a.id !== id);
  renderAttachmentBar();
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function transcribeAudioFile(att) {
  showToast(`Audio attached: "${att.name}". Note: Include context about this audio in your message.`, 'info');
}

/* ---- Input key handler ---- */
function handleInputKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendOrStop();
  }
}

/* ---- Send / Stop ---- */
function handleSendOrStop() {
  if (state.isLoading) {
    stopGeneration();
  } else {
    submitMessage();
  }
}

function stopGeneration() {
  if (state.abortController) {
    state.abortController.abort();
    state.abortController = null;
  }
  setLoading(false);
  showToast('Generation stopped.', 'info');
}

/* ---- Submit Message ---- */
async function submitMessage() {
  if (!state.apiKey) {
    showToast('Please enter your Grok API key in the sidebar.', 'warning');
    apiKeyInput.focus();
    return;
  }
  const text = messageInput.value.trim();
  const attachments = [...state.pendingAttachments];
  if (!text && attachments.length === 0) return;
  if (state.isLoading) return;

  // Clear input
  messageInput.value = '';
  autoResizeTextarea();
  state.pendingAttachments = [];
  renderAttachmentBar();

  // Hide welcome screen
  hideWelcome();

  // Add user message
  const userMsg = {
    id: uid(), role: 'user', content: text,
    attachments, timestamp: new Date()
  };
  state.messages.push(userMsg);
  renderMessage(userMsg);
  scrollToBottom();

  if (state.mode === 'auto') {
    await generateResponse();
  } else {
    // Manual mode — show generate banner
    state.pendingGenerate = true;
    generateBanner.hidden = false;
  }
}

/* ---- Generate Response ---- */
async function generateResponse() {
  if (state.isLoading) return;
  if (!state.apiKey) {
    showToast('Please save your Groq API key first.', 'warning');
    return;
  }

  // Hide generate banner
  generateBanner.hidden = true;
  state.pendingGenerate = false;

  setLoading(true);
  typingIndicator.hidden = false;
  scrollToBottom();

  // Build Groq messages
  const grokMessages = buildGrokMessages();

  // Create placeholder AI message for streaming
  const aiMsgId = uid();
  const aiMsg = { id: aiMsgId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true };
  state.messages.push(aiMsg);
  renderMessage(aiMsg);
  typingIndicator.hidden = true; // hide as soon as bubble is in DOM
  scrollToBottom();

  try {
    state.abortController = new AbortController();
    const fullText = await streamGrokResponse(grokMessages, state.apiKey, state.abortController.signal, aiMsgId);
    // Finalize
    const msgObj = state.messages.find(m => m.id === aiMsgId);
    if (msgObj) {
      msgObj.content = fullText;
      msgObj.isStreaming = false;
    }
    finalizeMessage(aiMsgId, fullText);
  } catch (err) {
    if (err.name === 'AbortError') return;
    const msgObj = state.messages.find(m => m.id === aiMsgId);
    if (msgObj) {
      msgObj.content = `Error: ${err.message || 'Failed to get response from Grok API.'}`;
      msgObj.isError = true;
      msgObj.isStreaming = false;
    }
    finalizeMessage(aiMsgId, null, true, err.message);
    showToast(err.message || 'API error. Check your key and network.', 'error');
  } finally {
    setLoading(false);
    typingIndicator.hidden = true;
    state.abortController = null;
  }
}

/* ---- Build Grok Messages payload ---- */
function buildGrokMessages() {
  const msgs = [{ role: 'system', content: SYSTEM_PROMPT }];
  // Only include last 20 messages to stay within context limits
  const history = state.messages.slice(-20);
  history.forEach(m => {
    if (m.role === 'assistant' && m.isStreaming) return;
    const contentParts = [];
    if (m.content) contentParts.push({ type: 'text', text: m.content });
    // Attach image data for vision
    if (m.attachments && m.attachments.length > 0) {
      m.attachments.forEach(att => {
        if (att.type === 'image' && att.dataUrl) {
          const base64 = att.dataUrl.split(',')[1];
          const mediaType = att.mimeType || 'image/png';
          contentParts.push({ type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64}` } });
        } else {
          // For non-image files, append a text note
          contentParts.push({ type: 'text', text: `[Attached file: ${att.name} (${att.mimeType || att.type})]` });
        }
      });
    }
    if (contentParts.length === 0) return;
    msgs.push({
      role: m.role,
      content: contentParts.length === 1 && contentParts[0].type === 'text'
        ? contentParts[0].text
        : contentParts
    });
  });
  return msgs;
}

/* ---- Groq Streaming API ---- */
async function streamGrokResponse(messages, apiKey, signal, msgId) {
  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true,
      temperature: 0.3,
      max_tokens: 4096,
    }),
    signal,
  });

  if (!response.ok) {
    const errBody = await response.text();
    let errMsg = `API error ${response.status}`;
    try {
      const errJson = JSON.parse(errBody);
      errMsg = errJson.error?.message || errMsg;
    } catch (_) {}
    throw new Error(errMsg);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete line

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            appendStreamChunk(msgId, fullText);
          }
        } catch (_) {}
      }
    }
  }
  return fullText;
}

/* ---- Render helpers ---- */
function setLoading(val) {
  state.isLoading = val;
  if (val) {
    sendIcon.style.display = 'none';
    stopIcon.style.display = '';
    sendBtn.classList.add('stop');
    sendBtn.setAttribute('aria-label', 'Stop generation');
    sendBtn.title = 'Stop generation';
  } else {
    sendIcon.style.display = '';
    stopIcon.style.display = 'none';
    sendBtn.classList.remove('stop');
    sendBtn.setAttribute('aria-label', 'Send message');
    sendBtn.title = 'Send (Enter)';
  }
}

function hideWelcome() {
  if (!welcomeScreen.classList.contains('hidden')) {
    welcomeScreen.classList.add('hidden');
  }
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatPanel.scrollTop = chatPanel.scrollHeight;
  });
}

/* ---- Render Message ---- */
function renderMessage(msg) {
  const wrapper = document.createElement('div');
  wrapper.className = 'message-wrapper';
  wrapper.setAttribute('data-id', msg.id);
  wrapper.setAttribute('role', 'listitem');

  const row = document.createElement('div');
  row.className = `message-row ${msg.role === 'user' ? 'user' : 'ai'}`;

  // Avatar
  const avatar = document.createElement('div');
  avatar.className = `avatar ${msg.role === 'user' ? 'user-avatar' : 'ai-avatar'}`;
  avatar.setAttribute('aria-hidden', 'true');
  if (msg.role === 'user') {
    avatar.textContent = 'U';
  } else {
    avatar.innerHTML = `<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="3" fill="currentColor"/></svg>`;
  }

  const contentWrap = document.createElement('div');
  contentWrap.className = 'message-content-wrap';

  // Attachment previews (user only)
  if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
    const attachLine = document.createElement('div');
    attachLine.className = 'msg-attachments';
    msg.attachments.forEach(att => {
      if (att.type === 'image' && att.dataUrl) {
        const img = document.createElement('img');
        img.src = att.dataUrl;
        img.alt = att.name;
        img.className = 'msg-img-preview';
        attachLine.appendChild(img);
      } else {
        const chip = document.createElement('span');
        chip.className = 'msg-attachment-chip';
        const iconSvg = att.type === 'audio'
          ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`
          : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>`;
        chip.innerHTML = `${iconSvg} ${att.name}`;
        attachLine.appendChild(chip);
      }
    });
    contentWrap.appendChild(attachLine);
  }

  // Bubble
  const bubble = document.createElement('div');
  bubble.className = `message-bubble${msg.isError ? ' error' : ''}`;
  bubble.setAttribute('data-bubble', msg.id);

  const bodyDiv = document.createElement('div');
  bodyDiv.className = 'msg-body';
  bodyDiv.setAttribute('data-body', msg.id);

  if (msg.role === 'user') {
    bodyDiv.textContent = msg.content;
  } else {
    bodyDiv.innerHTML = msg.isStreaming && !msg.content
      ? '<span class="streaming-cursor"></span>'
      : renderMarkdown(msg.content || '');
  }

  bubble.appendChild(bodyDiv);
  contentWrap.appendChild(bubble);

  // Meta (timestamp + actions)
  const meta = document.createElement('div');
  meta.className = 'message-meta';
  const ts = document.createElement('span');
  ts.className = 'message-timestamp';
  ts.textContent = formatTime(msg.timestamp);
  meta.appendChild(ts);

  // Copy button for AI messages
  if (msg.role === 'assistant') {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'msg-action-btn';
    copyBtn.title = 'Copy response';
    copyBtn.setAttribute('aria-label', 'Copy response');
    copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    copyBtn.addEventListener('click', () => copyToClipboard(msg.content, copyBtn));
    meta.appendChild(copyBtn);

    // TTS button
    const ttsBtn = document.createElement('button');
    ttsBtn.className = 'msg-action-btn';
    ttsBtn.title = 'Read aloud';
    ttsBtn.setAttribute('aria-label', 'Read message aloud');
    ttsBtn.setAttribute('data-tts', msg.id);
    ttsBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
    ttsBtn.addEventListener('click', () => speakMessage(msg.content, ttsBtn));
    meta.appendChild(ttsBtn);
  }

  contentWrap.appendChild(meta);
  row.appendChild(avatar);
  row.appendChild(contentWrap);
  wrapper.appendChild(row);
  messageList.appendChild(wrapper);
}

/* ---- Streaming append ---- */
function appendStreamChunk(msgId, fullText) {
  const bodyEl = document.querySelector(`[data-body="${msgId}"]`);
  if (!bodyEl) return;
  bodyEl.innerHTML = renderMarkdown(fullText) + '<span class="streaming-cursor"></span>';
  highlightCodeBlocks(bodyEl);
  renderMath(bodyEl);
  scrollToBottom();
}

/* ---- Finalize message ---- */
function finalizeMessage(msgId, content, isError, errMsg) {
  const bodyEl = document.querySelector(`[data-body="${msgId}"]`);
  if (!bodyEl) return;
  if (isError) {
    bodyEl.innerHTML = `<span style="color:var(--error)">⚠️ ${escapeHtml(errMsg || 'Unknown error')}</span>`;
    const bubble = document.querySelector(`[data-bubble="${msgId}"]`);
    if (bubble) bubble.classList.add('error');
  } else {
    bodyEl.innerHTML = renderMarkdown(content || '');
    highlightCodeBlocks(bodyEl);
    renderMath(bodyEl);
    addCopyButtons(bodyEl);
  }
  scrollToBottom();
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ---- Clear Chat ---- */
function clearChat() {
  state.messages = [];
  state.pendingAttachments = [];
  state.pendingGenerate = false;
  messageList.innerHTML = '';
  welcomeScreen.classList.remove('hidden');
  typingIndicator.hidden = true;
  generateBanner.hidden = true;
  attachmentBar.hidden = true;
  attachmentBar.innerHTML = '';
  setLoading(false);
  if (state.abortController) { state.abortController.abort(); state.abortController = null; }
}

/* ---- Markdown Rendering ---- */
function renderMarkdown(text) {
  if (!text) return '';
  const rawHtml = marked.parse(text, {
    breaks: true,
    gfm: true,
    renderer: buildMarkedRenderer(),
    async: false,
  });
  // Allow data-original attribute for code copy, but no inline event handlers
  return DOMPurify.sanitize(rawHtml, {
    ADD_ATTR: ['data-original', 'data-lang', 'target', 'rel'],
    FORCE_BODY: false,
  });
}

function buildMarkedRenderer() {
  const renderer = new marked.Renderer();

  // Code blocks with copy button — no inline onclick (use delegation)
  // marked v12: renderer.code(code, infostring, escaped)
  renderer.code = function(code, infostring) {
    const language = (infostring || 'text').split(' ')[0];
    const escaped = escapeHtml(code);
    return `<div class="code-block-wrapper">
      <div class="code-header">
        <span class="code-lang">${escapeHtml(language)}</span>
        <button class="copy-btn" aria-label="Copy code" data-copy-btn="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy
        </button>
      </div>
      <pre><code class="language-${escapeHtml(language)}" data-original="${encodeURIComponent(code)}">${escaped}</code></pre>
    </div>`;
  };

  // Links open in new tab
  renderer.link = function(href, title, text) {
    const safeHref = escapeHtml(href || '');
    const safeTitle = title ? ` title="${escapeHtml(title)}"` : '';
    return `<a href="${safeHref}"${safeTitle} target="_blank" rel="noopener noreferrer">${text}</a>`;
  };

  return renderer;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---- Code Highlighting ---- */
function highlightCodeBlocks(container) {
  if (typeof hljs === 'undefined') return;
  container.querySelectorAll('pre code').forEach(block => {
    hljs.highlightElement(block);
  });
}

/* ---- Add copy buttons (handled via event delegation; just run syntax highlight) ---- */
function addCopyButtons(container) {
  highlightCodeBlocks(container);
}

/* ---- Math Rendering ---- */
function renderMath(container) {
  if (typeof renderMathInElement === 'undefined') return;
  try {
    renderMathInElement(container, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false },
      ],
      throwOnError: false,
      output: 'htmlAndMathml',
    });
  } catch (e) {
    // Silently ignore KaTeX errors
  }
}

/* ---- Copy helpers ---- */
function copyCodeBlock(btn) {
  const code = btn.closest('.code-block-wrapper').querySelector('code');
  const original = decodeURIComponent(code.getAttribute('data-original') || '');
  const text = original || code.textContent;
  navigator.clipboard.writeText(text).then(() => {
    btn.classList.add('copied');
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
    }, 2000);
  }).catch(() => showToast('Copy failed. Please select manually.', 'error'));
}

function copyToClipboard(text, btn) {
  // Strip markdown for plain copy
  const plain = text.replace(/```[\s\S]*?```/g, '[code]').replace(/\$\$[\s\S]*?\$\$/g, '[formula]').replace(/[#*_`]/g, '').trim();
  navigator.clipboard.writeText(plain).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    btn.style.color = 'var(--success)';
    setTimeout(() => { btn.innerHTML = orig; btn.style.color = ''; }, 2000);
  });
}

/* ---- Toast ---- */
function showToast(message, type = 'info') {
  const icons = {
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${escapeHtml(message)}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4200);
}

/* ---- Voice / Speech ---- */
function toggleMic() {
  if (!state.isListening) {
    startListening();
  } else {
    stopListening();
  }
}

function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('Voice input is not supported in this browser. Try Chrome or Edge.', 'warning');
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    state.isListening = true;
    state.speechRecognition = recognition;
    micBtn.classList.add('listening');
    micBtn.setAttribute('aria-label', 'Stop voice input');
    micBtn.title = 'Stop recording';
    messageInput.placeholder = 'Listening…';
  };

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) final += t;
      else interim += t;
    }
    messageInput.value = final || interim;
    autoResizeTextarea();
  };

  recognition.onerror = (event) => {
    const msgs = {
      'not-allowed': 'Microphone access denied. Please allow mic permissions.',
      'no-speech': 'No speech detected. Please try again.',
      'network': 'Network error during speech recognition.',
    };
    showToast(msgs[event.error] || `Speech error: ${event.error}`, 'error');
    stopListening();
  };

  recognition.onend = () => {
    stopListening();
  };

  try {
    recognition.start();
  } catch (e) {
    showToast('Could not start microphone: ' + e.message, 'error');
  }
}

function stopListening() {
  state.isListening = false;
  if (state.speechRecognition) {
    try { state.speechRecognition.stop(); } catch (_) {}
    state.speechRecognition = null;
  }
  micBtn.classList.remove('listening');
  micBtn.setAttribute('aria-label', 'Start voice input');
  micBtn.title = 'Voice input';
  messageInput.placeholder = 'Ask a scientific question… (Shift+Enter for newline)';
}

function speakMessage(text, btn) {
  if (!window.speechSynthesis) {
    showToast('Text-to-speech is not supported in this browser.', 'warning');
    return;
  }
  if (state.isSpeaking) {
    window.speechSynthesis.cancel();
    state.isSpeaking = false;
    // Reset all TTS buttons
    document.querySelectorAll('[data-tts]').forEach(b => { b.style.color = ''; });
    return;
  }
  // Strip markdown/LaTeX for speech
  const cleanText = text
    .replace(/```[\s\S]*?```/g, ' code block ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' formula ')
    .replace(/\$[^$\n]+\$/g, ' formula ')
    .replace(/[*_#`>\[\]]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;

  utterance.onstart = () => {
    state.isSpeaking = true;
    if (btn) { btn.style.color = 'var(--accent)'; }
  };
  utterance.onend = utterance.onerror = () => {
    state.isSpeaking = false;
    if (btn) { btn.style.color = ''; }
  };

  window.speechSynthesis.speak(utterance);
}

/* ---- KaTeX deferred rendering ---- */
// KaTeX auto-render is loaded async; we also call it on each finalized message
document.addEventListener('DOMContentLoaded', () => {
  // Wait for KaTeX to be ready
  const waitForKatex = setInterval(() => {
    if (typeof renderMathInElement !== 'undefined') {
      clearInterval(waitForKatex);
    }
  }, 200);
});

/* ---- Drag & Drop on chat panel ---- */
chatPanel.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
chatPanel.addEventListener('drop', e => {
  e.preventDefault();
  const files = Array.from(e.dataTransfer.files);
  if (files.length === 0) return;
  files.forEach(file => processFile(file));
});

/* ---- Keyboard shortcut: Escape to stop ---- */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && state.isLoading) {
    stopGeneration();
  }
});

/* ---- Event delegation for code copy buttons ---- */
messageList.addEventListener('click', e => {
  const btn = e.target.closest('[data-copy-btn]');
  if (btn) copyCodeBlock(btn);
});

/* ---- Expose global for any legacy inline refs ---- */
window.copyCodeBlock = copyCodeBlock;

/* ---- Boot ---- */
document.addEventListener('DOMContentLoaded', init);
