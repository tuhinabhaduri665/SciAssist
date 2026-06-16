/* ============================================================
   SciAssist — Auth Logic (localStorage-based)
   ============================================================ */

'use strict';

/* ---- Storage helpers ---- */
const DB_KEY = 'sciassist-users';
const SESSION_KEY = 'sciassist-session';

function getUsers() {
  try { return JSON.parse(localStorage.getItem(DB_KEY) || '{}'); }
  catch (_) { return {}; }
}

function saveUsers(users) {
  localStorage.setItem(DB_KEY, JSON.stringify(users));
}

function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); }
  catch (_) { return null; }
}

function setSession(user, remember) {
  const data = JSON.stringify({ email: user.email, firstName: user.firstName, lastName: user.lastName });
  sessionStorage.setItem(SESSION_KEY, data);
  if (remember) localStorage.setItem(SESSION_KEY, data);
}

/* ---- Simple hash (not cryptographic — localStorage only, no sensitive data) ---- */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'sciassist-salt-v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ---- DOM refs ---- */
const tabLogin      = document.getElementById('tabLogin');
const tabRegister   = document.getElementById('tabRegister');
const panelLogin    = document.getElementById('panelLogin');
const panelRegister = document.getElementById('panelRegister');
const loginForm     = document.getElementById('loginForm');
const registerForm  = document.getElementById('registerForm');
const themeToggle   = document.getElementById('themeToggle');
const themeLabel    = document.getElementById('themeLabel');
const forgotBtn     = document.getElementById('forgotBtn');
const forgotModal   = document.getElementById('forgotModal');
const modalClose    = document.getElementById('modalClose');
const resetBtn      = document.getElementById('resetBtn');
const forgotEmail   = document.getElementById('forgotEmail');
const resetResult   = document.getElementById('resetResult');
const toastContainer = document.getElementById('toastContainer');

/* ---- Init ---- */
function init() {
  loadTheme();
  checkAlreadyLoggedIn();
  bindEvents();
}

/* ---- Already logged in? ---- */
function checkAlreadyLoggedIn() {
  const sess = getSession() || JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  if (sess && sess.email) {
    window.location.href = 'index.html';
  }
}

/* ---- Theme ---- */
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

/* ---- Tab switching ---- */
function showTab(tab) {
  const isLogin = tab === 'login';
  tabLogin.classList.toggle('active', isLogin);
  tabRegister.classList.toggle('active', !isLogin);
  tabLogin.setAttribute('aria-selected', String(isLogin));
  tabRegister.setAttribute('aria-selected', String(!isLogin));
  panelLogin.hidden = !isLogin;
  panelRegister.hidden = isLogin;
  clearAllErrors();
}

/* ---- Event bindings ---- */
function bindEvents() {
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  tabLogin.addEventListener('click', () => showTab('login'));
  tabRegister.addEventListener('click', () => showTab('register'));

  document.querySelectorAll('.switch-link').forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.target));
  });

  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);

  // Password visibility toggles
  document.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      btn.querySelector('.eye-icon').style.display = isText ? '' : 'none';
      btn.querySelector('.eye-off-icon').style.display = isText ? 'none' : '';
      btn.setAttribute('aria-label', isText ? 'Show password' : 'Hide password');
    });
  });

  // Password strength meter
  document.getElementById('regPassword').addEventListener('input', e => {
    updateStrength(e.target.value);
  });

  // Forgot password
  forgotBtn.addEventListener('click', openForgotModal);
  modalClose.addEventListener('click', closeForgotModal);
  forgotModal.addEventListener('click', e => { if (e.target === forgotModal) closeForgotModal(); });
  resetBtn.addEventListener('click', handleReset);
  forgotEmail.addEventListener('keydown', e => { if (e.key === 'Enter') handleReset(); });

  // Close modal on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !forgotModal.hidden) closeForgotModal();
  });
}

/* ---- Validation helpers ---- */
function setError(inputId, errId, message) {
  const input = document.getElementById(inputId);
  const err = document.getElementById(errId);
  if (input) input.classList.add('error');
  if (err) err.textContent = message;
}

function clearError(inputId, errId) {
  const input = document.getElementById(inputId);
  const err = document.getElementById(errId);
  if (input) input.classList.remove('error');
  if (err) err.textContent = '';
}

function clearAllErrors() {
  document.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; });
  document.querySelectorAll('.auth-input').forEach(el => { el.classList.remove('error', 'success'); });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/* ---- Password strength ---- */
function updateStrength(pw) {
  const container = document.getElementById('pwStrength');
  const label = document.getElementById('pwStrengthLabel');
  if (!pw) {
    container.className = 'pw-strength';
    label.textContent = '';
    return;
  }
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const levels = ['', 'pw-weak', 'pw-fair', 'pw-good', 'pw-good', 'pw-strong'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Good', 'Strong'];
  const idx = Math.max(1, Math.min(score, 5));
  container.className = `pw-strength ${levels[idx]}`;
  label.textContent = labels[idx];
}

/* ---- Login ---- */
async function handleLogin(e) {
  e.preventDefault();
  clearAllErrors();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const remember = document.getElementById('rememberMe').checked;

  let valid = true;
  if (!email) { setError('loginEmail', 'loginEmailErr', 'Email is required.'); valid = false; }
  else if (!isValidEmail(email)) { setError('loginEmail', 'loginEmailErr', 'Enter a valid email address.'); valid = false; }
  if (!password) { setError('loginPassword', 'loginPasswordErr', 'Password is required.'); valid = false; }
  if (!valid) return;

  const btn = document.getElementById('loginSubmit');
  setSubmitting(btn, true);

  await simulateDelay(600);

  const users = getUsers();
  const user = users[email.toLowerCase()];

  if (!user) {
    setError('loginEmail', 'loginEmailErr', 'No account found with this email.');
    setSubmitting(btn, false);
    return;
  }

  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) {
    setError('loginPassword', 'loginPasswordErr', 'Incorrect password.');
    setSubmitting(btn, false);
    return;
  }

  setSession(user, remember);
  showToast(`Welcome back, ${user.firstName}!`, 'success');
  setTimeout(() => { window.location.href = 'index.html'; }, 900);
}

/* ---- Register ---- */
async function handleRegister(e) {
  e.preventDefault();
  clearAllErrors();

  const firstName = document.getElementById('regFirstName').value.trim();
  const lastName  = document.getElementById('regLastName').value.trim();
  const email     = document.getElementById('regEmail').value.trim();
  const password  = document.getElementById('regPassword').value;
  const confirm   = document.getElementById('regConfirm').value;
  const agreed    = document.getElementById('agreeTerms').checked;

  let valid = true;
  if (!firstName) { setError('regFirstName', 'regFirstNameErr', 'First name is required.'); valid = false; }
  if (!lastName)  { setError('regLastName', 'regLastNameErr', 'Last name is required.'); valid = false; }
  if (!email) { setError('regEmail', 'regEmailErr', 'Email is required.'); valid = false; }
  else if (!isValidEmail(email)) { setError('regEmail', 'regEmailErr', 'Enter a valid email address.'); valid = false; }
  if (!password) { setError('regPassword', 'regPasswordErr', 'Password is required.'); valid = false; }
  else if (password.length < 8) { setError('regPassword', 'regPasswordErr', 'Password must be at least 8 characters.'); valid = false; }
  if (!confirm) { setError('regConfirm', 'regConfirmErr', 'Please confirm your password.'); valid = false; }
  else if (password !== confirm) { setError('regConfirm', 'regConfirmErr', 'Passwords do not match.'); valid = false; }
  if (!agreed) { document.getElementById('agreeTermsErr').textContent = 'You must agree to continue.'; valid = false; }
  if (!valid) return;

  const users = getUsers();
  if (users[email.toLowerCase()]) {
    setError('regEmail', 'regEmailErr', 'An account with this email already exists.');
    return;
  }

  const btn = document.getElementById('registerSubmit');
  setSubmitting(btn, true);

  await simulateDelay(700);

  const passwordHash = await hashPassword(password);
  const newUser = { email: email.toLowerCase(), firstName, lastName, passwordHash, createdAt: Date.now() };
  users[email.toLowerCase()] = newUser;
  saveUsers(users);

  setSession(newUser, false);
  showToast(`Account created! Welcome, ${firstName}!`, 'success');
  setTimeout(() => { window.location.href = 'index.html'; }, 900);
}

/* ---- Forgot Password ---- */
function openForgotModal() {
  forgotModal.hidden = false;
  forgotEmail.value = document.getElementById('loginEmail').value || '';
  resetResult.hidden = true;
  resetResult.textContent = '';
  setTimeout(() => forgotEmail.focus(), 50);
}

function closeForgotModal() {
  forgotModal.hidden = true;
}

async function handleReset() {
  const email = forgotEmail.value.trim();
  if (!email || !isValidEmail(email)) {
    showToast('Please enter a valid email address.', 'warning');
    forgotEmail.focus();
    return;
  }

  resetBtn.disabled = true;
  resetBtn.querySelector('.btn-text').textContent = 'Checking…';

  await simulateDelay(600);

  const users = getUsers();
  const user = users[email.toLowerCase()];

  resetResult.hidden = false;
  if (!user) {
    resetResult.className = 'reset-result error';
    resetResult.textContent = 'No account found with this email address.';
  } else {
    // Generate a temporary password
    const tempPw = generateTempPassword();
    const hash = await hashPassword(tempPw);
    user.passwordHash = hash;
    users[email.toLowerCase()] = user;
    saveUsers(users);
    resetResult.className = 'reset-result success';
    resetResult.innerHTML = `Your new temporary password is:<br><strong style="font-family:var(--font-mono);font-size:15px;letter-spacing:1px">${tempPw}</strong><br><small style="color:var(--text-muted)">Please change it after signing in.</small>`;
  }

  resetBtn.disabled = false;
  resetBtn.querySelector('.btn-text').textContent = 'Reset Password';
}

function generateTempPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  let pw = '';
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

/* ---- Utility: simulate async (UX polish) ---- */
function simulateDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function setSubmitting(btn, submitting) {
  btn.disabled = submitting;
  btn.querySelector('.btn-text').style.display = submitting ? 'none' : '';
  btn.querySelector('.btn-spinner').hidden = !submitting;
}

/* ---- Toast ---- */
function showToast(message, type = 'info') {
  const icons = {
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]||icons.info}</span><span>${message}</span>`;
  toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

/* ---- Boot ---- */
document.addEventListener('DOMContentLoaded', init);
