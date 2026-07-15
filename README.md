# CalmSet — Romanticize Your Focus

Ultra-minimalist productivity dashboard with a glassmorphism aesthetic, ambient sounds, Pomodoro timer, and task management.

## Quick Start

### 1. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the backend
```bash
python server.py
```
Server starts at **http://localhost:5000**

### 3. Open in browser
Navigate to **http://localhost:5000**

---

## File Structure

```
calmset/
├── index.html      ← Main layout & all components
├── style.css       ← Glassmorphism design system + themes
├── app.js          ← All front-end logic (timer, audio, tasks, settings)
├── server.py       ← Flask backend (tasks, settings, stats API)
├── requirements.txt
└── data.json       ← Auto-created; persists tasks & settings
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause timer |
| `R` | Reset timer |
| `1` | Pomodoro mode |
| `2` | Custom countdown |
| `3` | Stopwatch |
| `4` | Animedoro mode |

## Features

- **4-mode timer** — Pomodoro, Custom Countdown, Stopwatch, Animedoro
- **Picture-in-Picture** — Pop the timer out of the browser window
- **Ambient soundscapes** — Rain, Fireplace, Coffee Shop, Brown Noise (Web Audio API, no files needed)
- **Task manager** — With emoji, priority tags, and completion tracking
- **3 themes** — Cozy Night, Sunset Gradient, Forest Rain
- **Focus mode** — Hides all UI except the timer
- **Settings** — Persisted via Flask backend
- **Stats** — Focus minutes, streaks, completed tasks
