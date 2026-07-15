/**
 * CalmSet — app.js
 * All front-end logic: clock, timer, tasks, audio, themes, settings, stats
 */

'use strict';

const API = 'http://localhost:5000/api';

/* ═══════════════════════════════════════════════
   UTILITY
═══════════════════════════════════════════════ */
function $(id) { return document.getElementById(id); }

function toast(msg, dur = 2200) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), dur);
}

function pad(n) { return String(n).padStart(2, '0'); }

async function api(path, method = 'GET', body) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(API + path, opts);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  } catch (e) {
    console.warn('API error (offline mode):', e.message);
    return null;
  }
}

/* ═══════════════════════════════════════════════
   CLOCK
═══════════════════════════════════════════════ */
let clockFormat = '12';

function updateClock() {
  const now = new Date();
  let h = now.getHours(), m = now.getMinutes();
  let suffix = '';
  if (clockFormat === '12') {
    suffix = h >= 12 ? ' PM' : ' AM';
    h = h % 12 || 12;
  }
  $('clock-display').textContent = `${pad(h)}:${pad(m)}${suffix}`;
}

setInterval(updateClock, 1000);
updateClock();

/* ═══════════════════════════════════════════════
   QUOTES
═══════════════════════════════════════════════ */
const QUOTES = [
  '"The secret of getting ahead is getting started." — Mark Twain',
  '"Small steps every day lead to remarkable places."',
  '"Rest is not quitting; it is restoring."',
  '"Make your work a love letter to your future self."',
  '"Consistency is the silent superpower."',
  '"Slow and steady, then all at once."',
  '"Every session is a vote for the person you\'re becoming."',
  '"Romanticize the ordinary. Magic lives in routine."',
  '"Progress, not perfection — always."',
  '"Your focus is your most valuable asset. Spend it wisely."'
];

let quoteIdx = Math.floor(Math.random() * QUOTES.length);

function rotateQuote() {
  const el = $('quote-text');
  el.style.opacity = '0';
  setTimeout(() => {
    quoteIdx = (quoteIdx + 1) % QUOTES.length;
    el.textContent = QUOTES[quoteIdx];
    el.style.opacity = '1';
  }, 500);
}

$('quote-text').textContent = QUOTES[quoteIdx];
setInterval(rotateQuote, 18000);

/* ═══════════════════════════════════════════════
   TIMER ENGINE
═══════════════════════════════════════════════ */
const MODES = {
  pomodoro:  { label: 'Focus session', duration: 25 * 60 },
  countdown: { label: 'Custom timer',  duration: 45 * 60 },
  stopwatch: { label: 'Stopwatch',     duration: null },
  animedoro: { label: 'Anime break in', duration: 50 * 60 }
};

let currentMode = 'pomodoro';
let timerRunning = false;
let timerInterval = null;
let totalSeconds = MODES.pomodoro.duration;
let elapsedSeconds = 0;
let pomodoroPhase = 'focus'; // 'focus' | 'short_break' | 'long_break'
let pomodoroCount = 0;
let sessionStartTime = null;

// Timer durations from settings
let timerSettings = { focus: 25, short: 5, long: 15 };

function formatTime(s) {
  if (s == null) return '00:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}

function updateTimerDisplay() {
  const display = currentMode === 'stopwatch' ? elapsedSeconds : totalSeconds;
  $('timer-display').textContent = formatTime(display);

  if (currentMode !== 'stopwatch' && MODES[currentMode].duration) {
    const full = MODES[currentMode].duration;
    const pct = currentMode === 'pomodoro'
      ? (elapsedSeconds / full) * 100
      : ((full - totalSeconds) / full) * 100;
    const fill = $('progress-fill');
    fill.style.width = Math.min(100, Math.max(0, pct)) + '%';
    $('progress-track').setAttribute('aria-valuenow', Math.round(pct));
  }
}

function setMode(mode) {
  currentMode = mode;
  pauseTimer();

  // Update tabs
  document.querySelectorAll('.mode-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.mode === mode);
    t.setAttribute('aria-selected', t.dataset.mode === mode);
  });

  // Custom countdown input visibility
  $('countdown-input-row').style.display = mode === 'countdown' ? 'flex' : 'none';

  // Reset state
  elapsedSeconds = 0;
  $('progress-fill').style.width = '0%';

  if (mode === 'pomodoro') {
    totalSeconds = timerSettings.focus * 60;
    $('timer-label').textContent = 'Focus session';
    pomodoroPhase = 'focus';
    $('timer-display').style.color = 'var(--timer-focus)';
  } else if (mode === 'countdown') {
    const m = parseInt($('custom-mins').value) || 45;
    const s = parseInt($('custom-secs').value) || 0;
    totalSeconds = m * 60 + s;
    $('timer-label').textContent = 'Custom countdown';
    $('timer-display').style.color = 'var(--timer-stopwatch)';
  } else if (mode === 'stopwatch') {
    totalSeconds = 0;
    $('timer-label').textContent = 'Stopwatch';
    $('timer-display').style.color = 'var(--timer-stopwatch)';
    $('progress-fill').style.width = '0%';
  } else if (mode === 'animedoro') {
    totalSeconds = 50 * 60;
    $('timer-label').textContent = 'Focus — anime break next';
    $('timer-display').style.color = 'var(--timer-animedoro)';
  }

  updateTimerDisplay();
  MODES[mode].duration = totalSeconds;
}

function playTimer() {
  timerRunning = true;
  sessionStartTime = Date.now();
  $('play-icon').style.display = 'none';
  $('pause-icon').style.display = 'block';
  $('play-btn').setAttribute('aria-label', 'Pause timer');

  timerInterval = setInterval(() => {
    if (currentMode === 'stopwatch') {
      elapsedSeconds++;
      updateTimerDisplay();
    } else {
      if (totalSeconds > 0) {
        totalSeconds--;
        elapsedSeconds++;
        updateTimerDisplay();
      } else {
        onTimerComplete();
      }
    }
  }, 1000);
}

function pauseTimer() {
  timerRunning = false;
  clearInterval(timerInterval);
  $('play-icon').style.display = 'block';
  $('pause-icon').style.display = 'none';
  $('play-btn').setAttribute('aria-label', 'Play timer');
}

function togglePlayPause() {
  if (timerRunning) {
    pauseTimer();
    // Log partial session
    if (elapsedSeconds > 10) {
      const mins = Math.floor(elapsedSeconds / 60);
      if (mins > 0) api('/stats/session', 'POST', { minutes: mins, mode: currentMode });
    }
  } else {
    playTimer();
  }
}

function resetTimer() {
  pauseTimer();
  elapsedSeconds = 0;
  setMode(currentMode);
  toast('Timer reset');
}

function onTimerComplete() {
  pauseTimer();
  playAlertSound();

  // Log completed session
  const mins = Math.floor(elapsedSeconds / 60);
  if (mins > 0) {
    api('/stats/session', 'POST', { minutes: mins, mode: currentMode });
    fetchStats();
  }

  if (currentMode === 'pomodoro') {
    pomodoroCount++;
    if (pomodoroPhase === 'focus') {
      const breakType = pomodoroCount % 4 === 0 ? 'long_break' : 'short_break';
      const breakDur = breakType === 'long_break' ? timerSettings.long : timerSettings.short;
      pomodoroPhase = breakType;
      totalSeconds = breakDur * 60;
      elapsedSeconds = 0;
      MODES.pomodoro.duration = totalSeconds;
      $('timer-label').textContent = breakType === 'long_break' ? 'Long break' : 'Short break';
      $('timer-display').style.color = 'var(--timer-break)';
      toast(`Focus complete! ${breakType === 'long_break' ? 'Long' : 'Short'} break starting…`);
      // Auto-pause ambient if setting enabled
      if (appSettings.auto_pause_ambient) pauseAllSounds();
    } else {
      pomodoroPhase = 'focus';
      totalSeconds = timerSettings.focus * 60;
      elapsedSeconds = 0;
      MODES.pomodoro.duration = totalSeconds;
      $('timer-label').textContent = 'Focus session';
      $('timer-display').style.color = 'var(--timer-focus)';
      toast('Break over. Time to focus!');
    }
    updateTimerDisplay();
    playTimer(); // auto-advance
  } else if (currentMode === 'animedoro') {
    if ($('timer-label').textContent.includes('Focus')) {
      totalSeconds = 20 * 60;
      elapsedSeconds = 0;
      MODES.animedoro.duration = totalSeconds;
      $('timer-label').textContent = '🌸 Anime break — enjoy!';
      $('timer-display').style.color = 'var(--timer-break)';
      toast('Focus done! 20-minute anime break starting…');
      updateTimerDisplay();
      playTimer();
    } else {
      totalSeconds = 50 * 60;
      elapsedSeconds = 0;
      MODES.animedoro.duration = totalSeconds;
      $('timer-label').textContent = 'Focus — anime break next';
      $('timer-display').style.color = 'var(--timer-animedoro)';
      toast('Break over. Back to work!');
      updateTimerDisplay();
    }
  } else {
    toast('Timer complete! 🎉');
    setMode(currentMode);
  }
}

// Timer controls
$('play-btn').addEventListener('click', togglePlayPause);
$('reset-btn').addEventListener('click', resetTimer);

document.querySelectorAll('.mode-tab').forEach(tab => {
  tab.addEventListener('click', () => setMode(tab.dataset.mode));
});

// Custom countdown inputs
['custom-mins', 'custom-secs'].forEach(id => {
  $(id).addEventListener('change', () => {
    if (currentMode === 'countdown') setMode('countdown');
  });
});

/* ── PICTURE IN PICTURE ──────────────────────── */
$('pip-btn').addEventListener('click', async () => {
  try {
    if (!document.pictureInPictureElement) {
      // Draw timer to canvas and stream to video
      const canvas = document.createElement('canvas');
      canvas.width = 320; canvas.height = 160;
      const ctx = canvas.getContext('2d');

      function drawPip() {
        ctx.clearRect(0, 0, 320, 160);
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, 320, 160);
        ctx.fillStyle = 'rgba(124,106,255,0.15)';
        ctx.fillRect(0, 0, 320, 160);
        ctx.fillStyle = '#e8e4ff';
        ctx.font = '600 52px Space Grotesk, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const display = currentMode === 'stopwatch' ? elapsedSeconds : totalSeconds;
        ctx.fillText(formatTime(display), 160, 72);
        ctx.fillStyle = 'rgba(167,139,250,0.7)';
        ctx.font = '400 14px Inter, sans-serif';
        ctx.fillText($('timer-label').textContent, 160, 120);
        if (timerRunning) requestAnimationFrame(drawPip);
      }

      drawPip();
      const stream = canvas.captureStream(2);
      const video = $('pip-video');
      video.srcObject = stream;
      video.style.display = 'block';
      await video.play();
      await video.requestPictureInPicture();
      video.style.display = 'none';
      toast('Timer in Picture-in-Picture');
    } else {
      await document.exitPictureInPicture();
      toast('PiP closed');
    }
  } catch (e) {
    toast('PiP not supported in this browser');
  }
});

/* ── ALERT SOUND ─────────────────────────────── */
let alertCtx = null;
let appSettings = {};

function playAlertSound() {
  try {
    if (!alertCtx) alertCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = alertCtx;
    const sound = appSettings.alert_sound || 'digital_bell';
    const vol = (appSettings.alert_volume || 70) / 100;

    const gain = ctx.createGain();
    gain.gain.value = vol;
    gain.connect(ctx.destination);

    if (sound === 'digital_bell') {
      // Synthesize a simple bell
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } else if (sound === 'bird_chirp') {
      [0, 0.12, 0.24].forEach((delay, i) => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(1200 + i * 200, ctx.currentTime + delay);
        o.frequency.exponentialRampToValueAtTime(1600 + i * 100, ctx.currentTime + delay + 0.08);
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol * 0.6, ctx.currentTime + delay);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.15);
        o.connect(g); g.connect(ctx.destination);
        o.start(ctx.currentTime + delay);
        o.stop(ctx.currentTime + delay + 0.2);
      });
    } else {
      // Lofi chime
      [0, 0.3, 0.6].forEach((delay) => {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = [528, 660, 792][Math.floor(delay * 3.33)];
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol * 0.5, ctx.currentTime + delay);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.8);
        o.connect(g); g.connect(ctx.destination);
        o.start(ctx.currentTime + delay);
        o.stop(ctx.currentTime + delay + 0.8);
      });
    }
  } catch(e) { /* audio not available */ }
}

/* ═══════════════════════════════════════════════
   AMBIENT AUDIO MIXER
═══════════════════════════════════════════════ */
let audioCtx = null;
const soundState = { rain: false, fire: false, cafe: false, noise: false };
const gainNodes = {};

// Generate ambient sounds procedurally (no file deps)
function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

const activeSources = {};

function createNoiseBuffer(type = 'brown') {
  const ctx = getAudioContext();
  const bufferSize = ctx.sampleRate * 3; // 3 seconds
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'brown') {
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + (0.02 * white)) / 1.02;
      last = data[i];
      data[i] *= 3.5;
    }
  } else if (type === 'white') {
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  } else if (type === 'rain') {
    // Layered noise filtered to simulate rain
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + (0.04 * white)) / 1.04;
      last = data[i];
      data[i] *= 2.8;
    }
  }

  return buffer;
}

function startSound(name) {
  const ctx = getAudioContext();

  // Stop existing
  stopSound(name);

  const gain = ctx.createGain();
  gainNodes[name] = gain;
  gain.connect(ctx.destination);

  // Get volume
  const slider = document.querySelector(`.sound-vol[data-sound="${name}"]`);
  const vol = (parseInt(slider?.value || 60) / 100) * ((appSettings.master_volume || 80) / 100);
  gain.gain.value = vol;

  if (name === 'rain') {
    // Pink-ish filtered noise for rain
    const buffer = createNoiseBuffer('rain');
    const playLoop = () => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 0.5;
      source.connect(filter);
      filter.connect(gain);
      source.start();
      source.onended = () => { if (soundState.rain) playLoop(); };
      activeSources[name] = source;
    };
    playLoop();
  } else if (name === 'fire') {
    // Crackle: low-freq brown noise with occasional spikes
    const playFire = () => {
      const buffer = createNoiseBuffer('brown');
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      source.connect(filter);
      filter.connect(gain);
      source.start();
      source.onended = () => { if (soundState.fire) playFire(); };
      activeSources[name] = source;
    };
    playFire();
  } else if (name === 'cafe') {
    // Multiple filtered white noise layers
    const playCafe = () => {
      const buffer = createNoiseBuffer('white');
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 600;
      filter.Q.value = 0.8;
      source.connect(filter);
      filter.connect(gain);
      source.start();
      source.onended = () => { if (soundState.cafe) playCafe(); };
      activeSources[name] = source;
    };
    playCafe();
  } else if (name === 'noise') {
    // Brown noise
    const playNoise = () => {
      const buffer = createNoiseBuffer('brown');
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(gain);
      source.start();
      source.onended = () => { if (soundState.noise) playNoise(); };
      activeSources[name] = source;
    };
    playNoise();
  }
}

function stopSound(name) {
  try {
    if (activeSources[name]) {
      activeSources[name].stop();
      delete activeSources[name];
    }
  } catch(e) {}
}

function pauseAllSounds() {
  Object.keys(soundState).forEach(n => {
    if (soundState[n]) {
      stopSound(n);
      soundState[n] = false;
      updateSoundBtn(n, false);
    }
  });
}

function updateSoundBtn(name, playing) {
  const btn = document.querySelector(`.sound-toggle[data-sound="${name}"]`);
  if (!btn) return;
  btn.classList.toggle('playing', playing);
  btn.setAttribute('aria-pressed', playing);
}

// Toggle sound buttons
document.querySelectorAll('.sound-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.sound;
    soundState[name] = !soundState[name];
    if (soundState[name]) {
      startSound(name);
    } else {
      stopSound(name);
    }
    updateSoundBtn(name, soundState[name]);
  });
});

// Volume sliders
document.querySelectorAll('.sound-vol').forEach(slider => {
  slider.addEventListener('input', () => {
    const name = slider.dataset.sound;
    const pct = slider.parentElement.querySelector('.vol-pct');
    if (pct) pct.textContent = slider.value + '%';

    if (gainNodes[name]) {
      const vol = (parseInt(slider.value) / 100) * ((appSettings.master_volume || 80) / 100);
      gainNodes[name].gain.value = vol;
    }
  });
});

// Stream URL
$('stream-go').addEventListener('click', () => {
  const url = $('stream-url').value.trim();
  if (url) {
    window.open(url, '_blank', 'noopener');
    toast('Opening stream…');
  } else {
    toast('Paste a URL first');
  }
});

// Audio panel toggle
$('audio-trigger').addEventListener('click', (e) => {
  e.stopPropagation();
  const panel = $('audio-panel');
  const isOpen = panel.classList.toggle('open');
  $('audio-trigger').setAttribute('aria-expanded', isOpen);
  panel.setAttribute('aria-hidden', !isOpen);
  // Close others
  if (isOpen) {
    $('tasks-panel').classList.remove('open');
    $('stats-panel').classList.remove('open');
    $('theme-dropdown').classList.remove('open');
  }
});

/* ═══════════════════════════════════════════════
   SPOTIFY INTEGRATION
═══════════════════════════════════════════════ */
let spotifyConnected = false;

function showSpotifyConnected(trackData) {
  $('spotify-connect-row').style.display = 'none';
  $('spotify-connected').style.display = 'block';

  if (trackData && trackData.image) {
    $('spotify-album-art').src = trackData.image;
    $('spotify-track-name').textContent = trackData.track || 'Unknown Track';
    $('spotify-artist-name').textContent = trackData.artist || 'Unknown Artist';
  }
}

function hideSpotifyConnected() {
  $('spotify-connect-row').style.display = 'flex';
  $('spotify-connected').style.display = 'none';
  spotifyConnected = false;
}

$('spotify-connect-btn').addEventListener('click', () => {
  if (spotifyConnected) {
    hideSpotifyConnected();
    toast('Spotify disconnected');
  } else {
    // Simulate Spotify connection
    spotifyConnected = true;
    const mockTrack = {
      track: 'Lo-fi Study Beats',
      artist: 'ChillHop Music',
      image: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 300%22%3E%3Crect fill=%22%231DB954%22 width=%22300%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2248%22 font-weight=%22bold%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3ESpotify%3C/text%3E%3C/svg%3E'
    };
    showSpotifyConnected(mockTrack);
    toast('Connected to Spotify ✓');
  }
});

/* ═══════════════════════════════════════════════
   TASKS
═══════════════════════════════════════════════ */
let tasks = [];

async function fetchTasks() {
  const data = await api('/tasks');
  if (data) { tasks = data; renderTasks(); }
}

function renderTasks() {
  const list = $('task-list');
  list.innerHTML = '';
  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;

  // Progress
  $('task-progress-text').textContent = `${done} / ${total}`;
  $('task-progress-fill').style.width = total > 0 ? `${(done/total)*100}%` : '0%';

  if (tasks.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:24px 0;color:var(--text-muted);font-size:11px;">
      No tasks yet — add one above</div>`;
    return;
  }

  tasks.forEach(task => {
    const el = document.createElement('div');
    el.className = 'task-item';
    el.setAttribute('role', 'listitem');

    const checkbox = document.createElement('div');
    checkbox.className = 'task-checkbox' + (task.completed ? ' done' : '');
    checkbox.setAttribute('role', 'checkbox');
    checkbox.setAttribute('aria-checked', task.completed);
    checkbox.setAttribute('tabindex', '0');
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);
    checkbox.addEventListener('click', () => toggleTask(task.id, !task.completed));
    checkbox.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleTask(task.id, !task.completed); }
    });

    const emoji = document.createElement('span');
    emoji.className = 'task-emoji';
    emoji.textContent = task.emoji || '✦';
    emoji.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.className = 'task-text' + (task.completed ? ' done' : '');
    text.textContent = task.text;

    const priority = document.createElement('span');
    const pMap = { low: 'low', med: 'med', medium: 'med', high: 'high' };
    const pKey = pMap[task.priority] || 'low';
    priority.className = `task-priority priority-${pKey}`;
    priority.textContent = pKey === 'med' ? 'mid' : pKey;

    const del = document.createElement('button');
    del.className = 'task-delete';
    del.setAttribute('aria-label', `Delete task "${task.text}"`);
    del.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    del.addEventListener('click', () => deleteTask(task.id));

    el.append(checkbox, emoji, text, priority, del);
    list.appendChild(el);
  });
}

async function addTask() {
  const text = $('task-input').value.trim();
  if (!text) { $('task-input').focus(); return; }

  const emoji = $('task-emoji').value.trim() || '✦';
  const priority = $('task-priority').value;

  const task = { text, emoji, priority };
  const created = await api('/tasks', 'POST', task);

  if (created) {
    tasks.push(created);
  } else {
    // Offline fallback
    tasks.push({ ...task, id: Date.now().toString(), completed: false });
  }

  $('task-input').value = '';
  $('task-emoji').value = '';
  renderTasks();
  toast('Task added ✦');
}

async function toggleTask(id, completed) {
  tasks = tasks.map(t => t.id === id ? {...t, completed} : t);
  renderTasks();
  await api(`/tasks/${id}`, 'PATCH', { completed });
  if (completed) {
    toast('Task complete 🎉');
    fetchStats();
  }
}

async function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  renderTasks();
  await api(`/tasks/${id}`, 'DELETE');
}

// Task trigger
$('task-trigger').addEventListener('click', (e) => {
  e.stopPropagation();
  const panel = $('tasks-panel');
  const isOpen = panel.classList.toggle('open');
  $('task-trigger').setAttribute('aria-expanded', isOpen);
  panel.setAttribute('aria-hidden', !isOpen);
  if (isOpen) {
    $('audio-panel').classList.remove('open');
    $('stats-panel').classList.remove('open');
    $('theme-dropdown').classList.remove('open');
  }
});

$('add-task-btn').addEventListener('click', addTask);
$('task-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

/* ═══════════════════════════════════════════════
   THEMES
═══════════════════════════════════════════════ */
$('themes-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  const dd = $('theme-dropdown');
  const isOpen = dd.classList.toggle('open');
  $('themes-btn').setAttribute('aria-expanded', isOpen);
  if (isOpen) {
    $('tasks-panel').classList.remove('open');
    $('audio-panel').classList.remove('open');
    $('stats-panel').classList.remove('open');
  }
});

document.querySelectorAll('.theme-option').forEach(btn => {
  btn.addEventListener('click', () => {
    const theme = btn.dataset.theme;
    // Remove all themes
    document.body.classList.remove('theme-sunset', 'theme-forest');
    if (theme) document.body.classList.add(theme);

    // Update active
    document.querySelectorAll('.theme-option').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === theme);
      b.setAttribute('aria-selected', b.dataset.theme === theme);
    });

    $('theme-dropdown').classList.remove('open');
    toast(`Theme: ${btn.textContent.trim()}`);
  });
});

/* ═══════════════════════════════════════════════
   STATS
═══════════════════════════════════════════════ */
async function fetchStats() {
  const data = await api('/stats');
  if (!data) return;

  $('stat-focus').textContent = data.total_focus_minutes || 0;
  $('stat-streak').textContent = data.streak_days || 0;
  $('stat-tasks').textContent = data.completed_tasks_total || 0;
  $('streak-count').textContent = data.streak_days || 0;
  $('profile-focus-time').textContent = (data.total_focus_minutes || 0) + ' min';
  $('profile-tasks').textContent = data.completed_tasks_total || 0;
  $('profile-streak').textContent = (data.streak_days || 0) + ' days';

  // Mini chart
  renderMiniChart(data.sessions || []);
}

function renderMiniChart(sessions) {
  const chart = $('mini-chart');
  chart.innerHTML = '';

  // Aggregate last 7 days
  const days = Array(7).fill(0);
  const now = new Date();
  sessions.forEach(s => {
    const d = new Date(s.date);
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < 7) days[6 - diff] += (s.minutes || 0);
  });

  const max = Math.max(...days, 1);
  const dayLabels = ['M','T','W','T','F','S','S'];
  const today = new Date().getDay();

  days.forEach((val, i) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;';

    const bar = document.createElement('div');
    bar.className = 'mini-bar';
    const h = Math.max(4, (val / max) * 44);
    bar.style.height = h + 'px';
    bar.setAttribute('title', `${val} min focus`);
    bar.setAttribute('aria-label', `${val} focus minutes`);

    const lbl = document.createElement('div');
    lbl.style.cssText = 'font-size:9px;color:var(--text-muted);letter-spacing:0.05em;';
    lbl.textContent = dayLabels[(today - 6 + i + 7) % 7];

    wrapper.append(bar, lbl);
    chart.appendChild(wrapper);
  });
}

$('stats-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  const panel = $('stats-panel');
  const isOpen = panel.classList.toggle('open');
  $('stats-btn').setAttribute('aria-expanded', isOpen);
  panel.setAttribute('aria-hidden', !isOpen);
  if (isOpen) {
    fetchStats();
    $('theme-dropdown').classList.remove('open');
    $('tasks-panel').classList.remove('open');
    $('audio-panel').classList.remove('open');
  }
});

/* ═══════════════════════════════════════════════
   FOCUS MODE TOGGLE
═══════════════════════════════════════════════ */
let focusMode = false;
$('focus-mode-btn').addEventListener('click', () => {
  focusMode = !focusMode;
  document.body.classList.toggle('focus-mode', focusMode);
  $('focus-mode-lbl').textContent = focusMode ? 'focus' : 'ambient';
  $('focus-mode-btn').setAttribute('aria-pressed', focusMode);
  toast(focusMode ? 'Focus mode on — deep work time' : 'Ambient mode restored');
});

/* ═══════════════════════════════════════════════
   SETTINGS MODAL
═══════════════════════════════════════════════ */
function openSettings() {
  $('settings-overlay').classList.add('open');
  $('settings-overlay').setAttribute('aria-hidden', 'false');
  $('settings-close').focus();
  loadSettingsForm();
}

function closeSettings() {
  $('settings-overlay').classList.remove('open');
  $('settings-overlay').setAttribute('aria-hidden', 'true');
  $('settings-btn').focus();
}

$('settings-btn').addEventListener('click', openSettings);
$('settings-close').addEventListener('click', closeSettings);
$('settings-overlay').addEventListener('click', e => {
  if (e.target === $('settings-overlay')) closeSettings();
});

// Keyboard close
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if ($('settings-overlay').classList.contains('open')) closeSettings();
    // Also close panels
    $('tasks-panel').classList.remove('open');
    $('audio-panel').classList.remove('open');
    $('stats-panel').classList.remove('open');
    $('theme-dropdown').classList.remove('open');
  }
});

// Nav tabs
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
    item.classList.add('active');
    $('section-' + item.dataset.section).classList.add('active');
  });
});

// Sliders display
$('s-alert-vol').addEventListener('input', () => {
  $('alert-vol-val').textContent = $('s-alert-vol').value;
});

$('s-master-vol').addEventListener('input', () => {
  $('master-vol-val').textContent = $('s-master-vol').value;
  appSettings.master_volume = parseInt($('s-master-vol').value);
  // Update all active gains
  Object.keys(gainNodes).forEach(name => {
    const slider = document.querySelector(`.sound-vol[data-sound="${name}"]`);
    if (gainNodes[name] && slider) {
      gainNodes[name].gain.value = (parseInt(slider.value) / 100) * (appSettings.master_volume / 100);
    }
  });
});

// Clear mode toggle
$('s-clear-mode').addEventListener('change', () => {
  document.body.classList.toggle('clear-mode', $('s-clear-mode').checked);
});

async function loadSettingsForm() {
  const data = await api('/settings');
  if (data) {
    appSettings = data;
    $('s-username').value = data.username || '';
    $('s-clock-format').value = data.clock_format || '12';
    $('s-clear-mode').checked = data.clear_mode || false;
    $('s-focus').value = data.focus_duration || 25;
    $('s-short').value = data.short_break || 5;
    $('s-long').value = data.long_break || 15;
    $('s-alert-sound').value = data.alert_sound || 'digital_bell';
    $('s-alert-vol').value = data.alert_volume || 70;
    $('alert-vol-val').textContent = data.alert_volume || 70;
    $('s-master-vol').value = data.master_volume || 80;
    $('master-vol-val').textContent = data.master_volume || 80;
    $('s-auto-pause').checked = data.auto_pause_ambient !== false;
    clockFormat = data.clock_format || '12';
    updateClock();
    $('username-display').textContent = data.username || 'Friend';
    timerSettings = {
      focus: data.focus_duration || 25,
      short: data.short_break || 5,
      long: data.long_break || 15
    };
    document.body.classList.toggle('clear-mode', data.clear_mode || false);
  }
}

async function saveSettings(section) {
  let payload = {};
  if (section === 'general') {
    payload = {
      username: $('s-username').value.trim() || 'Friend',
      clock_format: $('s-clock-format').value,
      clear_mode: $('s-clear-mode').checked
    };
    clockFormat = payload.clock_format;
    $('username-display').textContent = payload.username;
    updateClock();
    document.body.classList.toggle('clear-mode', payload.clear_mode);
  } else if (section === 'timer') {
    payload = {
      focus_duration: parseInt($('s-focus').value) || 25,
      short_break: parseInt($('s-short').value) || 5,
      long_break: parseInt($('s-long').value) || 15,
      alert_sound: $('s-alert-sound').value,
      alert_volume: parseInt($('s-alert-vol').value)
    };
    timerSettings = { focus: payload.focus_duration, short: payload.short_break, long: payload.long_break };
    if (!timerRunning) setMode(currentMode);
  } else if (section === 'audio') {
    payload = {
      master_volume: parseInt($('s-master-vol').value),
      auto_pause_ambient: $('s-auto-pause').checked
    };
    appSettings.auto_pause_ambient = payload.auto_pause_ambient;
    appSettings.master_volume = payload.master_volume;
  }

  const result = await api('/settings', 'POST', payload);
  if (result) {
    appSettings = { ...appSettings, ...result };
    toast('Settings saved ✓');
  } else {
    // Offline fallback
    appSettings = { ...appSettings, ...payload };
    toast('Settings saved locally ✓');
  }
}

$('save-general').addEventListener('click', () => saveSettings('general'));
$('save-timer').addEventListener('click', () => saveSettings('timer'));
$('save-audio').addEventListener('click', () => saveSettings('audio'));

/* ═══════════════════════════════════════════════
   GLOBAL CLICK OUTSIDE — CLOSE PANELS
═══════════════════════════════════════════════ */
document.addEventListener('click', (e) => {
  const panels = [
    { panel: 'tasks-panel', trigger: 'task-trigger' },
    { panel: 'audio-panel', trigger: 'audio-trigger' },
    { panel: 'stats-panel', trigger: 'stats-btn' },
    { panel: 'theme-dropdown', trigger: 'themes-btn' }
  ];
  panels.forEach(({ panel, trigger }) => {
    const p = $(panel);
    const t = $(trigger);
    if (p && t && !p.contains(e.target) && !t.contains(e.target)) {
      p.classList.remove('open');
      p.setAttribute('aria-hidden', 'true');
      t.setAttribute('aria-expanded', 'false');
    }
  });
});

/* ═══════════════════════════════════════════════
   KEYBOARD SHORTCUTS
═══════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  // Don't fire on inputs/selects
  if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;

  if (e.code === 'Space') {
    e.preventDefault();
    togglePlayPause();
  } else if (e.code === 'KeyR' && !e.metaKey) {
    resetTimer();
  } else if (e.code === 'Digit1') setMode('pomodoro');
  else if (e.code === 'Digit2') setMode('countdown');
  else if (e.code === 'Digit3') setMode('stopwatch');
  else if (e.code === 'Digit4') setMode('animedoro');
});

/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */
async function init() {
  await loadSettingsForm();
  await fetchTasks();
  await fetchStats();
  setMode('pomodoro');
}

init();

// Show keyboard hint briefly
setTimeout(() => {
  toast('Tip: Space = play/pause · R = reset · 1-4 = switch mode');
}, 1800);
