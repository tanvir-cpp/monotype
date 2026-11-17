# LUMEN // Tactile Typewriter

A skeuomorphic, highly tactile web typewriter simulator featuring real-time volumetric lighting, organic ink physics, and procedural Web Audio mechanical sound synthesis with zero external audio assets.

Live demo: [https://tanvir-cpp.github.io/monotype/](https://tanvir-cpp.github.io/monotype/)

---

## Project Structure

```
monotype/
├── css/
│   └── style.css          # Skeuomorphic styling, mechanical animations & responsive layout
├── js/
│   ├── config.js         # Themes, typography, state variables & DOM element cache
│   ├── audio.js          # Procedural Web Audio engine (key strikes, bells, carriage, rain)
│   ├── renderer.js       # Volumetric spotlight shader, fibrous paper texture & DOM ink rendering
│   ├── typewriter.js     # Core mechanics, ink physics, margin collars & localStorage persistence
│   └── app.js            # HUD controls, event listeners, animation loop & application bootstrap
├── index.html            # Clean application entry point linking modular CSS & JS
└── README.md             # Project documentation
```

---

## Architectural Breakdown

### 1. `css/style.css`
- **Rail & Platen Mechanics**: Cylindrical gunmetal rail, margin clamp collars, and platen depth shadows.
- **Carriage & Striker**: Physical T-striker hammer with upward impact snap, rebound keyframes, and micro-LED status indicators (ready green, strike pulse amber, margin warning red-orange).
- **Ink & Typography**: Carbon-black typewriter ink typography with micro-rotations and fresh impression stamping animations.
- **Glassmorphic HUD**: Mobile-responsive top-right controls with custom tactile range sliders.

### 2. `js/config.js`
- **Themes & Palettes**: Definitions for *Fibrous Taupe* and *Dim Study* (paper base, vignette colors, warm tungsten lighting gradients).
- **Application State**: Coordinates (`railY`, `targetCarriageX`, `targetPaperY`), typing margins, font family, lamp intensity, and correction modes.
- **DOM Cache**: Centralized DOM queries managed under the `Lumen.dom` namespace.

### 3. `js/audio.js`
- **Pure Procedural Audio Synthesis**: Generates all sounds dynamically using the browser's Web Audio API without downloading external audio files:
  - **Hammer Strike**: Bandpass-filtered noise burst + pitch-swept triangle body oscillator + high-frequency resonant spring tail with pitch jitter.
  - **Ratchet Tick**: Square-wave frequency sweep on backspace and arrow navigation.
  - **Brass Margin Bell**: Inharmonic sinusoidal partials (2380 Hz, 4110 Hz, 6240 Hz) triggering near the right margin.
  - **Carriage Return**: Rapid stepped ratchet clicks + roller line-feed clunk.
  - **Rain & Thunder Soundscape**: Filtered continuous white/pink noise sculpted into windowpane rain with scheduled lowpass thunder rumbles.

### 4. `js/renderer.js`
- **Procedural Paper Texture**: Canvas generator creating seamless organic cotton micro-filaments, natural dark specks, and surface mineral tooth.
- **Volumetric Spotlight Cone**: Dynamic ~112-degree warm tungsten radial cone projecting upward from the carriage amber slot onto the fibrous paper.
- **DOM Ink Layer**: Generates individual character cells with organic jitter ($\pm 0.3\text{px}$ offset and micro-rotation).

### 5. `js/typewriter.js`
- **Typing Mechanics**: Character stamping, automatic word-wrap with lookback hyphenation, carriage return, and backspace.
- **Dual Correction Modes**: Authentic *Lift-Off* (ribbon tape character erasure) and vintage *Overstrike* (layering physical ink strikes over existing letters).
- **State Persistence**: Automatic syncing of manuscript text, theme, and lighting settings to `localStorage`.

### 6. `js/app.js`
- **Interaction Management**: Event listeners for physical keyboards, mobile soft keyboard bridges via `visualViewport`, touch drag paper scrolling, and mouse wheel navigation.
- **HUD Settings**: Lamp brightness slider, theme switching, typeface switching (Courier Prime, Special Elite, IBM Plex Mono), audio toggles, and .txt manuscript export.
- **Animation Loop**: Smooth damped lerp interpolation for sliding pill carriage and vertical paper feeding.

---

## Running Locally

Because the project uses standard modular scripts with `defer`, you can run it in any of the following ways:

### Option A: Open directly in your browser
Simply double-click `index.html` or open `file:///path/to/monotype/index.html`.

### Option B: Local HTTP Server
```bash
# Using Python
python3 -m http.server 8000

# Using Node.js npx
npx serve .
```
Then visit `http://localhost:8000`.

---

## Deployment

Changes to the `main` branch are automatically deployed to GitHub Pages at:
[https://tanvir-cpp.github.io/monotype/](https://tanvir-cpp.github.io/monotype/)

