# CalmSet — Romanticize Your Focus ✨

Ultra-minimalist, mobile-friendly productivity dashboard with glassmorphism aesthetic, advanced ambient sounds, multi-mode timer, wallpaper customization, and comprehensive task management.

**Perfect for**: Deep focus work, Pomodoro sessions, meditation, productivity tracking, and romanticizing your routine.

---

## 🚀 Quick Start

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
Navigate to **http://localhost:5000** on any device

---

## 📁 File Structure

```
calmset/
├── index.html        ← Main layout & all components
├── style.css         ← Glassmorphism design + themes + mobile responsive
├── app.js            ← All front-end logic (timer, audio, tasks, settings, browser detection)
├── server.py         ← Flask backend (tasks, settings, stats API)
├── requirements.txt  ← Python dependencies
└── data.json         ← Auto-created; persists tasks & settings
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause timer |
| `R` | Reset timer |
| `1` | Pomodoro mode |
| `2` | Custom countdown |
| `3` | Stopwatch |
| `4` | Animedoro mode |

---

## ✨ Features

### ⏱️ Multi-Mode Timer
- **Pomodoro** — 25 min focus + configurable breaks
- **Custom Countdown** — Set any duration (minutes & seconds)
- **Stopwatch** — Track unlimited time
- **Animedoro** — 50 min focus + 20 min anime break
- Automatic phase transitions
- Configurable durations in settings

### 🎵 Premium Soundscapes
Professional-grade audio synthesis with multiple layered sound sources:
- **🌧️ Rain** — Multi-layer filtering with high & mid-frequency rain patter
- **🔥 Fireplace** — Realistic rumble with crackling effects & pop sounds
- **☕ Coffee Shop** — 3-layer ambience (voice rumble, chatter, espresso machines)
- **🌊 Brown Noise** — Clean, smooth noise for focus & meditation
- Master volume control
- Individual sound volume sliders
- Auto-pause on breaks (optional)
- Real-time procedural generation (no files needed)

### 🖼️ Wallpaper Customization
- Upload custom backgrounds (PNG, JPEG)
- Max 5MB file size
- Live preview in settings
- Persistent storage (localStorage)
- Quick remove option
- Professional wallpaper display with fixed background

### 📝 Advanced Task Manager
- Add tasks with emoji & priority levels (Low, Medium, High)
- Track completion progress with visual progress bar
- Task counter (X of Y completed)
- Priority-based color coding
- Delete & mark complete functionality
- Persisted via Flask backend

### 🎨 Three Beautiful Themes
- **Cozy Night** (default) — Purple & dark blue gradient
- **Sunset Gradient** — Warm orange & brown tones
- **Forest Rain** — Deep green & nature vibes
- All themes use glassmorphism aesthetic
- One-click theme switching

### 🎯 Focus Mode
- Hides all UI except the timer
- Perfect for distraction-free deep work
- Quick toggle in dashboard
- Keyboard accessible

### 🌐 Fullscreen Mode
- Enter/exit fullscreen with one click
- Cross-browser support (Chrome, Edge, Safari, Firefox)
- Button state syncs with fullscreen state
- Perfect for immersive focus sessions

### 📱 Mobile Responsive Design
**Fully responsive across all devices:**
- **Desktop** (1024px+) — Full grid layout with all features
- **Tablet** (768px-1023px) — Optimized layout, flexible spacing
- **Mobile** (480px-767px) — Single column, touch-friendly buttons
- **Small Mobile** (<480px) — Extra compact, fully readable
- Touch-optimized button sizes
- Readable font sizes on all screens
- Mobile-optimized settings modal

### 🌐 Cross-Browser Compatibility
Works seamlessly on:
- ✅ **Chrome** (all features)
- ✅ **Edge** (all features)
- ✅ **Safari** (all features including Picture-in-Picture)
- ✅ **Firefox** (all features except PiP)
- ✅ **iOS Safari** (responsive, all features optimized)
- ✅ **Android Chrome** (responsive, touch-optimized)

### 📸 Picture-in-Picture Timer
- Pop timer into floating window
- Works on Chrome, Edge, Safari 15.1+
- Continue working while watching timer
- Seamless enter/exit
- Perfect for multitasking

### ⚙️ Comprehensive Settings
**General Settings:**
- Custom username (appears in greeting)
- Clock format (12-hour or 24-hour)
- Clear mode toggle (timer-only UI)

**Focus Timer Settings:**
- Adjustable focus duration (1-120 min)
- Configurable short & long breaks
- Multiple alert sounds (Digital Bell, Bird Chirp, Lofi Chime)
- Alert volume control

**Audio & Sound Settings:**
- Master volume control for all sounds
- Auto-pause ambient on breaks toggle
- Individual soundscape volume sliders

**Wallpaper Settings:**
- Upload custom background images
- Preview current wallpaper
- Remove wallpaper option

**Profile & Plan:**
- View total focus time
- Track completed tasks
- Daily streak counter
- CalmSet Pro preview

### 📊 Statistics & Tracking
- Total focus minutes (last 7 days)
- Daily streak counter with badge
- Completed tasks total
- Weekly activity chart with daily breakdown
- Persistent stats via Flask backend

---

## 🎮 User Interface

### Dashboard Layout
```
┌─────────────────────────────────────────┐
│  CalmSet [Streak] │      Stats │ Theme │
├─────────────────────────────────────────┤
│                                         │
│          🕐 12:00 AM                   │
│    Greeting & Inspirational Quote      │
│                                         │
│        ┌─────────────────────┐         │
│        │    25:00            │         │
│        │   Focus session     │         │
│        │ ▓▓▓▓░░░░░░░░░░░░  │         │
│        │ ⟲  ▶  ◻  ⛶         │         │
│        └─────────────────────┘         │
│                                         │
├─────────────────────────────────────────┤
│  📋 Tasks  │  🎵 Soundscapes  │ 🎯 📺 ⚙│
└─────────────────────────────────────────┘
```

**Bottom Controls:**
- Tasks Manager
- Soundscapes Mixer
- Focus Mode Toggle
- Fullscreen Mode Toggle
- Settings

---

## 🛠️ Technical Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Python Flask
- **Audio**: Web Audio API (procedural generation)
- **Storage**: JSON (local data persistence)
- **Styling**: Custom CSS with CSS variables, Tailwind utilities
- **Responsive**: Mobile-first CSS media queries

---

## 🎯 Use Cases

✅ **Pomodoro Focus Sessions** — 25min work + 5min breaks with ambient sound
✅ **Deep Work Blocks** — Custom timers + fullscreen mode for distraction-free coding
✅ **Meditation & Relaxation** — Brown noise or rain with no timer
✅ **Anime Breaks** — Animedoro mode for anime enthusiasts
✅ **Productivity Tracking** — Track streaks, stats, and completed tasks
✅ **Mobile Productivity** — Full responsive design for on-the-go use

---

## 🚀 Version History

### v2.0.0 — Latest
- ✨ Wallpaper customization (PNG/JPEG, 5MB max)
- 🎵 Professional soundscape audio synthesis (4 improved sounds)
- 📱 Complete mobile responsive design (3 breakpoints)
- 🖥️ Fullscreen mode with cross-browser support
- 🌐 Cross-browser compatibility (Chrome, Edge, Safari, Firefox)
- 🎯 Repositioned UI controls (Focus + Fullscreen + Settings)
- 🔧 Browser detection & automatic feature support

### v1.0.0
- 4-mode timer system
- Basic soundscapes
- Task manager
- Theme switching
- Stats tracking
- Focus mode

---

## 📝 Browser Support Matrix

| Feature | Chrome | Edge | Safari | Firefox | iOS Safari | Android |
|---------|--------|------|--------|---------|------------|---------|
| Timer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Soundscapes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fullscreen | ✅ | ✅ | ✅ | ✅ | ✅* | ✅ |
| Picture-in-Picture | ✅ | ✅ | ✅** | ⚠️ | ✅** | ✅ |
| Wallpaper | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mobile Responsive | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

\* iOS: Fullscreen requires Safari 15.1+
\** Safari: Picture-in-Picture requires Safari 15.1+
⚠️ Firefox: PiP not yet supported

---

## 💡 Tips & Tricks

- **Combine soundscapes** — Mix rain + coffee shop for the perfect focus environment
- **Customize timers** — Adjust durations in settings for your workflow
- **Use themes** — Pick a theme that matches your mood
- **Enable fullscreen** — For immersive, distraction-free sessions
- **Track your streak** — Build consistency with daily focus sessions
- **Set a custom wallpaper** — Personalize your dashboard with your favorite image

---

## 🎨 Design Philosophy

CalmSet embraces **glassmorphism** for a modern, minimalist aesthetic that's both beautiful and functional. Every element serves a purpose, and the interface adapts seamlessly to any screen size.

---

Made with ✨ for focus enthusiasts who romanticize their productivity.
