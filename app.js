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
  playAlertSound().catch(e => console.warn('Alert sound error:', e));

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
let pipAnimFrame = null;

$('pip-btn').addEventListener('click', async () => {
  try {
    // Exit PiP if already active
    if (document.pictureInPictureElement ||
        (document.webkitCurrentFullScreenElement && $('pip-video').webkitDisplayingFullscreen)) {
      if (document.exitPictureInPicture) {
        await document.exitPictureInPicture();
      } else if ($('pip-video').webkitExitPictureInPicture) {
        $('pip-video').webkitExitPictureInPicture();
      }
      toast('PiP closed');
      return;
    }

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
      pipAnimFrame = requestAnimationFrame(drawPip);
    }

    // Check for captureStream support (Chrome, Edge, Safari 11+)
    const captureStreamFn = canvas.captureStream || canvas.mozCaptureStream;
    if (!captureStreamFn) {
      toast('PiP not supported — use Fullscreen instead');
      return;
    }

    drawPip();
    const stream = captureStreamFn.call(canvas, 30);
    const video = $('pip-video');
    video.srcObject = stream;

    // Safari requires the video to be in the DOM and visible briefly
    video.style.display = 'block';
    video.style.position = 'fixed';
    video.style.top = '-9999px';

    await video.play().catch(() => {});

    // Chrome/Edge: standard PiP
    if (video.requestPictureInPicture) {
      await video.requestPictureInPicture();
      video.style.display = 'none';
      toast('Timer in Picture-in-Picture');
    }
    // Safari 14+: webkit PiP
    else if (video.webkitSupportsPresentationMode &&
             video.webkitSupportsPresentationMode('picture-in-picture')) {
      video.webkitSetPresentationMode('picture-in-picture');
      toast('Timer in Picture-in-Picture');
    }
    else {
      // Fallback: enter fullscreen with the pip video visible
      if (cancelAnimationFrame) cancelAnimationFrame(pipAnimFrame);
      video.style.display = 'none';
      toast('PiP not supported — try Fullscreen mode');
    }

    video.addEventListener('leavepictureinpicture', () => {
      if (cancelAnimationFrame) cancelAnimationFrame(pipAnimFrame);
      video.style.display = 'none';
    }, { once: true });
    video.addEventListener('webkitpresentationmodechanged', () => {
      if (video.webkitPresentationMode !== 'picture-in-picture') {
        if (cancelAnimationFrame) cancelAnimationFrame(pipAnimFrame);
        video.style.display = 'none';
      }
    }, { once: true });
  } catch (e) {
    console.warn('PiP error:', e);
    toast('Picture-in-Picture not supported in this browser');
  }
});

/* ── FULLSCREEN MODE ─────────────────────────── */
function isFullscreen() {
  return !!(document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement);
}

function syncFullscreenBtn() {
  const on = isFullscreen();
  $('fullscreen-btn').setAttribute('aria-pressed', on);
  // Swap icon between expand and compress
  const btn = $('fullscreen-btn');
  btn.innerHTML = on
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>Exit Full`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>Fullscreen`;
}

$('fullscreen-btn').addEventListener('click', () => {
  const docEl = document.documentElement;

  if (!isFullscreen()) {
    const req = docEl.requestFullscreen ||
                docEl.webkitRequestFullscreen ||
                docEl.mozRequestFullScreen ||
                docEl.msRequestFullscreen;
    if (req) {
      req.call(docEl).catch(err => toast('Fullscreen: ' + err.message));
    } else {
      toast('Fullscreen not supported in this browser');
    }
  } else {
    const exit = document.exitFullscreen ||
                 document.webkitExitFullscreen ||
                 document.mozCancelFullScreen ||
                 document.msExitFullscreen;
    if (exit) exit.call(document);
  }
});

// Sync button on any fullscreen change (Chrome, Edge, Safari, Firefox)
['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','MSFullscreenChange'].forEach(evt => {
  document.addEventListener(evt, syncFullscreenBtn);
});

/* ── ALERT SOUND (ringtone on timer complete) ─── */
let alertCtx = null;
let appSettings = {};

// Unlock AudioContext on first user gesture (required by all browsers)
function getAlertCtx() {
  if (!alertCtx) alertCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume if suspended (Safari / Chrome autoplay policy)
  if (alertCtx.state === 'suspended') alertCtx.resume().catch(() => {});
  return alertCtx;
}

document.addEventListener('click', () => { try { getAlertCtx(); } catch(e){} }, { once: true });
document.addEventListener('keydown', () => { try { getAlertCtx(); } catch(e){} }, { once: true });

async function playAlertSound() {
  try {
    const ctx = getAlertCtx();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    const sound = appSettings.alert_sound || 'digital_bell';
    const vol = (appSettings.alert_volume || 70) / 100;

    // Play 3 repetitions of the chosen sound so it's unmissable
    const reps = 3;
    for (let rep = 0; rep < reps; rep++) {
      const repOffset = rep * 1.5; // space each repetition 1.5s apart

      if (sound === 'digital_bell') {
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime + repOffset);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + repOffset + 0.6);
        gain.gain.setValueAtTime(vol, ctx.currentTime + repOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + repOffset + 1.1);
        osc.connect(gain);
        osc.start(ctx.currentTime + repOffset);
        osc.stop(ctx.currentTime + repOffset + 1.1);
      } else if (sound === 'bird_chirp') {
        [0, 0.12, 0.24].forEach((delay, i) => {
          const t = ctx.currentTime + repOffset + delay;
          const o = ctx.createOscillator();
          o.type = 'sine';
          o.frequency.setValueAtTime(1200 + i * 200, t);
          o.frequency.exponentialRampToValueAtTime(1600 + i * 100, t + 0.08);
          const g = ctx.createGain();
          g.gain.setValueAtTime(vol * 0.8, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          o.connect(g); g.connect(ctx.destination);
          o.start(t);
          o.stop(t + 0.2);
        });
      } else {
        // Lofi chime
        [0, 0.35, 0.7].forEach((delay, i) => {
          const t = ctx.currentTime + repOffset + delay;
          const o = ctx.createOscillator();
          o.type = 'triangle';
          o.frequency.value = [528, 660, 792][i];
          const g = ctx.createGain();
          g.gain.setValueAtTime(vol * 0.7, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
          o.connect(g); g.connect(ctx.destination);
          o.start(t);
          o.stop(t + 0.9);
        });
      }
    }
  } catch(e) {
    console.warn('Alert sound error:', e);
  }
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
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

const activeSources = {};

function createNoiseBuffer(type = 'brown') {
  const ctx = getAudioContext();
  const bufferSize = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'brown') {
    // Improved brown noise with better spectral characteristics
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + (0.025 * white)) / 1.025;
      last = data[i];
      data[i] *= 3.2;
    }
  } else if (type === 'pink') {
    // Pink noise for more natural sounds
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + (0.015 * white)) / 1.015;
      last = data[i];
      data[i] *= 2.5;
    }
  } else if (type === 'white') {
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  } else if (type === 'rain') {
    // Rain-specific noise with pink characteristics
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + (0.018 * white)) / 1.018;
      last = data[i];
      data[i] *= 2.9;
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
    // Realistic rain with multiple filtered layers
    const playRain = () => {
      const buffer = createNoiseBuffer('rain');

      // Layer 1: High-frequency rain patter (3000-6000Hz)
      const source1 = ctx.createBufferSource();
      source1.buffer = buffer;
      const filter1 = ctx.createBiquadFilter();
      filter1.type = 'highpass';
      filter1.frequency.value = 3000;
      const filter1b = ctx.createBiquadFilter();
      filter1b.type = 'lowpass';
      filter1b.frequency.value = 6000;
      const gain1 = ctx.createGain();
      gain1.gain.value = 0.6;
      source1.connect(filter1);
      filter1.connect(filter1b);
      filter1b.connect(gain1);
      gain1.connect(gain);

      // Layer 2: Mid-frequency rain (1000-3000Hz)
      const source2 = ctx.createBufferSource();
      source2.buffer = buffer;
      const filter2 = ctx.createBiquadFilter();
      filter2.type = 'bandpass';
      filter2.frequency.value = 2000;
      filter2.Q.value = 0.7;
      const gain2 = ctx.createGain();
      gain2.gain.value = 0.4;
      source2.connect(filter2);
      filter2.connect(gain2);
      gain2.connect(gain);

      source1.start();
      source2.start();
      source1.onended = () => { if (soundState.rain) playRain(); };
      activeSources[name] = source1;
    };
    playRain();
  } else if (name === 'fire') {
    // Realistic fireplace with crackling effects
    const playFire = () => {
      const buffer = createNoiseBuffer('brown');

      // Main fire rumble
      const source1 = ctx.createBufferSource();
      source1.buffer = buffer;
      const filter1 = ctx.createBiquadFilter();
      filter1.type = 'lowpass';
      filter1.frequency.value = 400;
      filter1.Q.value = 0.8;
      const gain1 = ctx.createGain();
      gain1.gain.value = 0.5;
      source1.connect(filter1);
      filter1.connect(gain1);
      gain1.connect(gain);

      // Crackling mid-range
      const source2 = ctx.createBufferSource();
      source2.buffer = buffer;
      const filter2 = ctx.createBiquadFilter();
      filter2.type = 'bandpass';
      filter2.frequency.value = 1200;
      filter2.Q.value = 1.2;
      const gain2 = ctx.createGain();
      gain2.gain.value = 0.4;
      source2.connect(filter2);
      filter2.connect(gain2);
      gain2.connect(gain);

      // Add occasional pops/crackles with oscillators
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          if (soundState.fire) {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            const crackGain = ctx.createGain();
            crackGain.gain.setValueAtTime(0.3, ctx.currentTime);
            crackGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            osc.frequency.setValueAtTime(Math.random() * 400 + 100, ctx.currentTime);
            osc.connect(crackGain);
            crackGain.connect(gain);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
          }
        }, i * 800 + Math.random() * 400);
      }

      source1.start();
      source2.start();
      source1.onended = () => { if (soundState.fire) playFire(); };
      activeSources[name] = source1;
    };
    playFire();
  } else if (name === 'cafe') {
    // Coffee shop ambience with multiple layers
    const playCafe = () => {
      const buffer = createNoiseBuffer('white');

      // Layer 1: Low rumble (voices beneath)
      const source1 = ctx.createBufferSource();
      source1.buffer = buffer;
      const filter1 = ctx.createBiquadFilter();
      filter1.type = 'lowpass';
      filter1.frequency.value = 300;
      const gain1 = ctx.createGain();
      gain1.gain.value = 0.3;
      source1.connect(filter1);
      filter1.connect(gain1);
      gain1.connect(gain);

      // Layer 2: Voice range chatter (500-2000Hz)
      const source2 = ctx.createBufferSource();
      source2.buffer = buffer;
      const filter2 = ctx.createBiquadFilter();
      filter2.type = 'bandpass';
      filter2.frequency.value = 1200;
      filter2.Q.value = 0.9;
      const gain2 = ctx.createGain();
      gain2.gain.value = 0.5;
      source2.connect(filter2);
      filter2.connect(gain2);
      gain2.connect(gain);

      // Layer 3: High ambient (espresso machine, cups clinking)
      const source3 = ctx.createBufferSource();
      source3.buffer = buffer;
      const filter3 = ctx.createBiquadFilter();
      filter3.type = 'highpass';
      filter3.frequency.value = 2000;
      const gain3 = ctx.createGain();
      gain3.gain.value = 0.2;
      source3.connect(filter3);
      filter3.connect(gain3);
      gain3.connect(gain);

      source1.start();
      source2.start();
      source3.start();
      source1.onended = () => { if (soundState.cafe) playCafe(); };
      activeSources[name] = source1;
    };
    playCafe();
  } else if (name === 'noise') {
    // Clean, smooth brown noise
    const playNoise = () => {
      const buffer = createNoiseBuffer('brown');
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Apply gentle smoothing filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 8000;
      filter.Q.value = 0.5;

      source.connect(filter);
      filter.connect(gain);
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
   WALLPAPER SETTINGS
═══════════════════════════════════════════════ */
let wallpaperData = null;

function loadWallpaperPreview() {
  const stored = localStorage.getItem('calmset_wallpaper');
  if (stored) {
    wallpaperData = stored;
    document.body.style.backgroundImage = `url('${stored}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    $('wallpaper-preview').innerHTML = '<img src="' + stored + '" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" alt="Wallpaper preview" />';
    $('remove-wallpaper-btn').style.display = 'block';
  }
}

$('wallpaper-upload').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const maxSize = 5 * 1024 * 1024; // 5MB
  const validTypes = ['image/png', 'image/jpeg', 'application/pdf'];

  if (file.size > maxSize) {
    toast('File too large. Max 5MB.');
    return;
  }

  // For PDF, we'll just show a message that only image format is supported for display
  if (file.type === 'application/pdf') {
    toast('PDFs cannot be displayed as wallpapers. Please use PNG or JPEG.');
    return;
  }

  if (!validTypes.includes(file.type)) {
    toast('Invalid file type. Use PNG, JPEG, or PDF.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    wallpaperData = event.target.result;
    $('wallpaper-preview').innerHTML = '<img src="' + wallpaperData + '" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" alt="Wallpaper preview" />';
    toast('Wallpaper loaded. Click "Save Wallpaper" to apply.');
  };
  reader.readAsDataURL(file);
});

$('save-wallpaper').addEventListener('click', () => {
  if (wallpaperData) {
    localStorage.setItem('calmset_wallpaper', wallpaperData);
    document.body.style.backgroundImage = `url('${wallpaperData}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    $('remove-wallpaper-btn').style.display = 'block';
    toast('Wallpaper saved and applied ✓');
  } else {
    toast('No wallpaper selected');
  }
});

$('remove-wallpaper-btn').addEventListener('click', () => {
  localStorage.removeItem('calmset_wallpaper');
  document.body.style.backgroundImage = 'none';
  document.body.style.backgroundColor = '';
  wallpaperData = null;
  $('wallpaper-preview').innerHTML = 'No custom wallpaper set';
  $('wallpaper-upload').value = '';
  $('remove-wallpaper-btn').style.display = 'none';
  toast('Wallpaper removed');
});

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
   BROWSER DETECTION & MOBILE OPTIMIZATION
═══════════════════════════════════════════════ */
function detectBrowser() {
  const ua = navigator.userAgent;
  const browser = {
    isChrome: /Chrome/.test(ua) && !/Edge/.test(ua),
    isEdge: /Edg/.test(ua),
    isSafari: /Safari/.test(ua) && !/Chrome/.test(ua) && !/Edg/.test(ua),
    isFirefox: /Firefox/.test(ua),
    isMobile: /iPhone|iPad|Android|webOS|BlackBerry|Windows Phone/.test(ua),
    isIOS: /iPhone|iPad/.test(ua)
  };
  return browser;
}

const browserInfo = detectBrowser();

// Mobile viewport optimization
if (browserInfo.isMobile) {
  document.body.style.touchAction = 'manipulation';
  document.documentElement.style.overscrollBehavior = 'none';
}

// Safari fullscreen compatibility
if (browserInfo.isSafari && browserInfo.isIOS) {
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      window.scrollTo(0, 0);
    }
  });
}

/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */
async function init() {
  await loadSettingsForm();
  await fetchTasks();
  await fetchStats();
  loadWallpaperPreview();
  setMode('pomodoro');
}

init();

// Show keyboard hint briefly
setTimeout(() => {
  toast('Tip: Space = play/pause · R = reset · 1-4 = switch mode');
}, 1800);
