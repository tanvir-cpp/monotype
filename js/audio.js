/**
 * LUMEN // Tactile Typewriter
 * Procedural Web Audio Synthesizer (Mechanical Keys, Bell, Carriage & Rain)
 */
window.Lumen = window.Lumen || {};

(function (Lumen) {
  'use strict';

  class TypewriterAudioEngine {
    constructor() {
      this.audioCtx = null;
      this.noiseBuffer = null;
      this.rainNode = null;
      this.rainGain = null;
      this.thunderTimer = null;
    }

    init() {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        this.audioCtx = new AudioContextClass();
        this.createNoiseBuffer();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    }

    createNoiseBuffer() {
      const sampleRate = this.audioCtx.sampleRate;
      const length = sampleRate * 3; // 3 seconds of seamless white/pink noise
      const buffer = this.audioCtx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }

    // Crisp mechanical typebar strike against paper & rubber platen
    playKeyStrike(isSpace = false) {
      const state = Lumen.state;
      if (!state.mechSoundEnabled || state.mechVolume <= 0.01) return;
      this.init();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const vol = state.mechVolume;
      const pitchJitter = 0.92 + Math.random() * 0.16;

      // 1. Metallic Hammer Impact Click (Bandpass Noise Burst)
      const noiseSrc = this.audioCtx.createBufferSource();
      noiseSrc.buffer = this.noiseBuffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime((isSpace ? 1600 : 3100) * pitchJitter, now);
      filter.Q.setValueAtTime(isSpace ? 1.8 : 2.6, now);

      const clickGain = this.audioCtx.createGain();
      clickGain.gain.setValueAtTime(0.001, now);
      clickGain.gain.linearRampToValueAtTime((isSpace ? 0.38 : 0.55) * vol, now + 0.002);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + (isSpace ? 0.045 : 0.024));

      noiseSrc.connect(filter);
      filter.connect(clickGain);
      clickGain.connect(this.audioCtx.destination);
      noiseSrc.start(now, Math.random() * 2, 0.06);

      // 2. Woody / Platen Thud Body (Pitch-envelope Triangle Oscillator)
      const osc = this.audioCtx.createOscillator();
      osc.type = 'triangle';
      const startFreq = (isSpace ? 135 : 210) * pitchJitter;
      const endFreq = (isSpace ? 44 : 62) * pitchJitter;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + (isSpace ? 0.055 : 0.032));

      const bodyGain = this.audioCtx.createGain();
      bodyGain.gain.setValueAtTime((isSpace ? 0.52 : 0.36) * vol, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + (isSpace ? 0.065 : 0.038));

      osc.connect(bodyGain);
      bodyGain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.07);

      // 3. Tiny metallic spring resonance tail
      const springOsc = this.audioCtx.createOscillator();
      springOsc.type = 'sine';
      springOsc.frequency.setValueAtTime(1480 * pitchJitter, now + 0.005);
      const springGain = this.audioCtx.createGain();
      springGain.gain.setValueAtTime(0.035 * vol, now + 0.005);
      springGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      springOsc.connect(springGain);
      springGain.connect(this.audioCtx.destination);
      springOsc.start(now + 0.005);
      springOsc.stop(now + 0.05);
    }

    // Subtle mechanical escapement release click on keyup
    playKeyRelease() {
      const state = Lumen.state;
      if (!state.mechSoundEnabled || state.mechVolume <= 0.01) return;
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const vol = state.mechVolume * 0.22;

      const noiseSrc = this.audioCtx.createBufferSource();
      noiseSrc.buffer = this.noiseBuffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2400, now);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

      noiseSrc.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);
      noiseSrc.start(now, Math.random() * 2, 0.02);
    }

    // Crisp ratchet pawl click for Backspace
    playBackspaceTick() {
      const state = Lumen.state;
      if (!state.mechSoundEnabled || state.mechVolume <= 0.01) return;
      this.init();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const vol = state.mechVolume * 0.45;

      const osc = this.audioCtx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.018);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.025);
    }

    // Classic brass margin bell Ding!
    playMarginBell() {
      const state = Lumen.state;
      if (!state.mechSoundEnabled || state.mechVolume <= 0.01) return;
      this.init();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const vol = state.mechVolume * 0.35;

      // Inharmonic metallic bell partials
      const freqs = [2380, 4110, 6240];
      const decays = [1.25, 0.65, 0.35];
      const weights = [1.0, 0.45, 0.25];

      freqs.forEach((f, idx) => {
        const osc = this.audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(vol * weights[idx], now + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decays[idx]);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + decays[idx] + 0.05);
      });
    }

    // Rapid carriage slide zip + line feed roller clunk on Enter
    playCarriageReturn(distanceCols = 25) {
      const state = Lumen.state;
      if (!state.mechSoundEnabled || state.mechVolume <= 0.01) return;
      this.init();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const vol = state.mechVolume;
      const steps = Math.min(14, Math.max(4, Math.floor(distanceCols / 3)));
      const stepInterval = 0.012;

      for (let i = 0; i < steps; i++) {
        const t = now + i * stepInterval;
        const osc = this.audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(900 + i * 35, t);
        osc.frequency.exponentialRampToValueAtTime(320, t + 0.009);

        const g = this.audioCtx.createGain();
        g.gain.setValueAtTime(0.14 * vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.01);

        osc.connect(g);
        g.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.012);
      }

      // Final mechanical stop thud + platen line feed ratchet
      const endT = now + steps * stepInterval;
      const stopOsc = this.audioCtx.createOscillator();
      stopOsc.type = 'sine';
      stopOsc.frequency.setValueAtTime(145, endT);
      stopOsc.frequency.exponentialRampToValueAtTime(48, endT + 0.05);

      const stopGain = this.audioCtx.createGain();
      stopGain.gain.setValueAtTime(0.45 * vol, endT);
      stopGain.gain.exponentialRampToValueAtTime(0.0001, endT + 0.06);

      stopOsc.connect(stopGain);
      stopGain.connect(this.audioCtx.destination);
      stopOsc.start(endT);
      stopOsc.stop(endT + 0.065);
    }

    // Soft paper roller friction rustle when scrolling history
    playPaperScrollRustle() {
      const state = Lumen.state;
      if (!state.mechSoundEnabled || state.mechVolume <= 0.01) return;
      this.init();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const noiseSrc = this.audioCtx.createBufferSource();
      noiseSrc.buffer = this.noiseBuffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(850, now);
      filter.Q.setValueAtTime(1.5, now);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.08 * state.mechVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      noiseSrc.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);
      noiseSrc.start(now, Math.random() * 2, 0.05);
    }

    // Procedural Cozy Heavy Rain & Distant Thunder Soundscape
    toggleRain(enable) {
      this.init();
      if (!this.audioCtx) return;

      const state = Lumen.state;

      if (enable) {
        if (this.rainNode) return;
        const now = this.audioCtx.currentTime;

        // Continuous looping noise source sculpted into steady windowpane rain
        const src = this.audioCtx.createBufferSource();
        src.buffer = this.noiseBuffer;
        src.loop = true;

        const lowpass = this.audioCtx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(1350, now);

        const highpass = this.audioCtx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(220, now);

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(state.rainVolume * 0.22, now + 1.2);

        src.connect(lowpass);
        lowpass.connect(highpass);
        highpass.connect(gain);
        gain.connect(this.audioCtx.destination);
        src.start(now);

        this.rainNode = src;
        this.rainGain = gain;

        // Schedule occasional subtle distant thunder rumbles
        this.scheduleThunder();
      } else {
        if (this.rainGain && this.audioCtx) {
          const now = this.audioCtx.currentTime;
          this.rainGain.gain.linearRampToValueAtTime(0.0001, now + 0.6);
          const oldNode = this.rainNode;
          setTimeout(() => {
            try { if (oldNode) oldNode.stop(); } catch (e) {}
          }, 650);
        }
        this.rainNode = null;
        this.rainGain = null;
        if (this.thunderTimer) {
          clearTimeout(this.thunderTimer);
          this.thunderTimer = null;
        }
      }
    }

    updateRainVolume(val) {
      if (this.rainGain && this.audioCtx) {
        this.rainGain.gain.setTargetAtTime(val * 0.22, this.audioCtx.currentTime, 0.15);
      }
    }

    scheduleThunder() {
      const state = Lumen.state;
      if (!state.rainEnabled) return;
      const nextDelay = 12000 + Math.random() * 18000;
      this.thunderTimer = setTimeout(() => {
        if (!state.rainEnabled || !this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        const src = this.audioCtx.createBufferSource();
        src.buffer = this.noiseBuffer;

        const lp = this.audioCtx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(95, now);

        const g = this.audioCtx.createGain();
        const peak = state.rainVolume * 0.35;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(peak, now + 0.8);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);

        src.connect(lp);
        lp.connect(g);
        g.connect(this.audioCtx.destination);
        src.start(now, 0, 3.0);

        this.scheduleThunder();
      }, nextDelay);
    }
  }

  Lumen.AudioEngine = TypewriterAudioEngine;
  Lumen.audio = new TypewriterAudioEngine();
})(window.Lumen);
