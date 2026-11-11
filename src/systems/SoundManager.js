import { gameState } from './GameState.js';

class SoundManager {
  constructor() {
    this.ctx = null;
  }

  ensureContext() {
    if (gameState.progress.settings.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  tone(freq, duration = 0.12, type = 'square', volume = 0.08, delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playClick() {
    this.tone(520, 0.06, 'square', 0.06);
  }

  playAlert() {
    this.tone(240, 0.14, 'sawtooth', 0.08, 0);
    this.tone(190, 0.18, 'sawtooth', 0.08, 0.14);
  }

  playTick() {
    this.tone(760, 0.04, 'triangle', 0.05);
  }

  playBreatheIn() {
    this.tone(260, 0.28, 'sine', 0.06, 0);
    this.tone(330, 0.35, 'sine', 0.06, 0.18);
  }

  playBreatheOut() {
    this.tone(392, 0.25, 'sine', 0.06, 0);
    this.tone(294, 0.4, 'sine', 0.05, 0.2);
  }

  playSuccess() {
    this.tone(523.25, 0.1, 'triangle', 0.08, 0);
    this.tone(659.25, 0.12, 'triangle', 0.08, 0.09);
    this.tone(783.99, 0.18, 'triangle', 0.09, 0.18);
  }

  playTransmute() {
    this.tone(392, 0.1, 'sine', 0.08, 0);
    this.tone(493.88, 0.1, 'sine', 0.08, 0.08);
    this.tone(587.33, 0.12, 'sine', 0.08, 0.16);
    this.tone(783.99, 0.24, 'triangle', 0.09, 0.24);
  }

  playBlockSnap() {
    this.tone(440, 0.07, 'triangle', 0.07);
  }

  playError() {
    this.tone(220, 0.14, 'sawtooth', 0.08, 0);
    this.tone(165, 0.22, 'sawtooth', 0.08, 0.12);
  }

  playBreakdown() {
    this.tone(260, 0.16, 'sawtooth', 0.09, 0);
    this.tone(210, 0.16, 'sawtooth', 0.09, 0.15);
    this.tone(145, 0.32, 'sawtooth', 0.09, 0.3);
  }

  playDayWin() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => this.tone(n, 0.22, 'triangle', 0.09, idx * 0.11));
  }
}

export const soundManager = new SoundManager();
