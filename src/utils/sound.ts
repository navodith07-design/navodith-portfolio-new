// High-Fidelity Web Audio Sound Effects Engine for Interactive Portfolio
// Synthesizes zero-latency acoustic & tactile haptic sound effects without external audio assets

let audioCtx: AudioContext | null = null;
let isAudioMuted: boolean = false;

// Initialize or resume the shared AudioContext
export function getSoundContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new AudioCtx();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

// Global Mute State Management
export function isMuted(): boolean {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("site_sound_muted");
    if (stored !== null) {
      isAudioMuted = stored === "true";
    }
  }
  return isAudioMuted;
}

export function setMuted(muted: boolean): boolean {
  isAudioMuted = muted;
  if (typeof window !== "undefined") {
    localStorage.setItem("site_sound_muted", String(muted));
  }
  return isAudioMuted;
}

export function toggleMute(): boolean {
  return setMuted(!isMuted());
}

// 1. Subtle Micro-Tick (Hovering navigation links, buttons, tags, project cards)
export function playHoverTick(volume: number = 0.2, pitchFactor: number = 1.0) {
  if (isMuted()) return;
  try {
    const ctx = getSoundContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(2200 * pitchFactor, t);
    osc.frequency.exponentialRampToValueAtTime(300 * pitchFactor, t + 0.009);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2800, t);
    filter.Q.setValueAtTime(4, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(Math.min(volume, 1) * 0.25, t + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.015);
  } catch (e) {}
}

// 2. Crisp Tactile Click Pop (Buttons, links, card triggers, interactive switches)
export function playClickPop(volume: number = 0.35, pitchFactor: number = 1.0) {
  if (isMuted()) return;
  try {
    const ctx = getSoundContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Transient Snap
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1600 * pitchFactor, t);
    osc.frequency.exponentialRampToValueAtTime(140 * pitchFactor, t + 0.018);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2400, t);
    filter.Q.setValueAtTime(3.5, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(Math.min(volume, 1) * 0.45, t + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.022);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.025);

    // Warm Low Body
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = "triangle";
    sub.frequency.setValueAtTime(320 * pitchFactor, t);
    sub.frequency.exponentialRampToValueAtTime(60, t + 0.03);

    subGain.gain.setValueAtTime(0, t);
    subGain.gain.linearRampToValueAtTime(Math.min(volume, 1) * 0.3, t + 0.001);
    subGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);

    sub.connect(subGain);
    subGain.connect(ctx.destination);

    sub.start(t);
    sub.stop(t + 0.04);
  } catch (e) {}
}

// 3. Ambient Fluid Water Splash / Droplet Burst (For Hero showreel card click & liquid reveal)
export function playLiquidSplash(volume: number = 0.45) {
  if (isMuted()) return;
  try {
    const ctx = getSoundContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Droplet Sine Pitch Drop
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.06);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.2);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(Math.min(volume, 1) * 0.35, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);

    // Fluid Filtered Noise Splash
    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(1800, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(600, t + 0.2);
    noiseFilter.Q.setValueAtTime(2.5, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, t);
    noiseGain.gain.linearRampToValueAtTime(Math.min(volume, 1) * 0.3, t + 0.015);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    whiteNoise.start(t);
    whiteNoise.stop(t + 0.28);
  } catch (e) {}
}

// 4. Harmonic Success Chime (Copying email, submitting, successful action)
export function playHarmonicChime(volume: number = 0.35) {
  if (isMuted()) return;
  try {
    const ctx = getSoundContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    const notes = [880, 1174.66, 1760]; // A5 -> D6 -> A6
    notes.forEach((freq, i) => {
      const startT = t + i * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startT);

      gain.gain.setValueAtTime(0, startT);
      gain.gain.linearRampToValueAtTime(Math.min(volume, 1) * 0.25, startT + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startT + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startT);
      osc.stop(startT + 0.4);
    });
  } catch (e) {}
}

// 5. Menu Open Smooth Swell & Whoosh
export function playMenuOpen(volume: number = 0.35) {
  if (isMuted()) return;
  try {
    const ctx = getSoundContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(580, t + 0.2);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(1400, t + 0.2);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(Math.min(volume, 1) * 0.3, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.28);
  } catch (e) {}
}

// 6. Menu Close Falling Snap
export function playMenuClose(volume: number = 0.3) {
  if (isMuted()) return;
  try {
    const ctx = getSoundContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.12);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(Math.min(volume, 1) * 0.28, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.18);
  } catch (e) {}
}

// 7. Soft Airy Tone Swell (Hovering 3D Marquee text rows in Hero)
let lastMarqueeToneTime = 0;
export function playMarqueeTone(rowIndex: number = 0, volume: number = 0.18) {
  if (isMuted()) return;
  const now = performance.now();
  if (now - lastMarqueeToneTime < 80) return;
  lastMarqueeToneTime = now;

  try {
    const ctx = getSoundContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Harmonic pentatonic scale based on row index
    const scale = [329.63, 392.00, 440.00, 523.25, 587.33, 659.25]; // E4, G4, A4, C5, D5, E5
    const freq = scale[rowIndex % scale.length];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(Math.min(volume, 1) * 0.2, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.45);
  } catch (e) {}
}

// 8. Preloader Complete Cinematic Unveil Tone
export function playPreloaderComplete(volume: number = 0.4) {
  if (isMuted()) return;
  try {
    const ctx = getSoundContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Rich chord: C4, G4, C5, E5
    const chord = [261.63, 392.00, 523.25, 659.25];
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(Math.min(volume, 1) * 0.18, t + 0.08 + i * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 1.0);
    });
  } catch (e) {}
}

// 9. Upward Sweep Whoosh (Back to top / quick section jumps)
export function playWhoosh(volume: number = 0.25) {
  if (isMuted()) return;
  try {
    const ctx = getSoundContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(750, t + 0.18);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(1800, t + 0.18);
    filter.Q.setValueAtTime(2, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(Math.min(volume, 1) * 0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  } catch (e) {}
}

// 10. Cinematic Motion-Based Sound Effects (Aerodynamic Whoosh, Kinetic Air Displacement, Soft Lens Physics)

let cachedNoiseBuffer: AudioBuffer | null = null;
function getPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (cachedNoiseBuffer && cachedNoiseBuffer.sampleRate === ctx.sampleRate) {
    return cachedNoiseBuffer;
  }
  const bufferSize = Math.floor(ctx.sampleRate * 0.8);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  cachedNoiseBuffer = buffer;
  return buffer;
}

let lastWhooshTime = 0;
// Smooth Aerodynamic Motion Whoosh (Simulates physical motion and air friction as elements glide/scale)
export function playKineticWhoosh(direction: 'in' | 'out' | 'glide' = 'in', volume: number = 0.18) {
  if (isMuted()) return;
  const now = performance.now();
  if (now - lastWhooshTime < 60) return;
  lastWhooshTime = now;

  try {
    const ctx = getSoundContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const duration = direction === 'glide' ? 0.28 : 0.35;

    // 1. Filtered Aerodynamic Air Friction (Pink noise swept through resonant bandpass filter)
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = getPinkNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.setValueAtTime(2.2, t);

    if (direction === 'in') {
      filter.frequency.setValueAtTime(320, t);
      filter.frequency.exponentialRampToValueAtTime(1400, t + duration * 0.65);
      filter.frequency.exponentialRampToValueAtTime(700, t + duration);
    } else if (direction === 'out') {
      filter.frequency.setValueAtTime(1200, t);
      filter.frequency.exponentialRampToValueAtTime(380, t + duration);
    } else {
      filter.frequency.setValueAtTime(600, t);
      filter.frequency.exponentialRampToValueAtTime(1600, t + duration * 0.5);
      filter.frequency.exponentialRampToValueAtTime(500, t + duration);
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(Math.min(volume, 1) * 0.38, t + duration * 0.25);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noiseSource.start(t);
    noiseSource.stop(t + duration);

    // 2. Sub-Aero Air Cushion (Gentle low displacement wave)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = "sine";
    const startFreq = direction === 'in' ? 65 : 120;
    const endFreq = direction === 'in' ? 140 : 55;
    subOsc.frequency.setValueAtTime(startFreq, t);
    subOsc.frequency.exponentialRampToValueAtTime(endFreq, t + duration * 0.8);

    subGain.gain.setValueAtTime(0, t);
    subGain.gain.linearRampToValueAtTime(Math.min(volume, 1) * 0.18, t + duration * 0.2);
    subGain.gain.exponentialRampToValueAtTime(0.0001, t + duration * 0.85);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(t);
    subOsc.stop(t + duration);
  } catch (e) {}
}

// Subtle Air Displacement Sweep (Gentle velocity-based breath on subtle interactive elements)
export function playAirDisplacement(volume: number = 0.12) {
  if (isMuted()) return;
  try {
    const ctx = getSoundContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const duration = 0.18;

    const noise = ctx.createBufferSource();
    noise.buffer = getPinkNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.setValueAtTime(1.8, t);
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(1800, t + duration * 0.4);
    filter.frequency.exponentialRampToValueAtTime(600, t + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(Math.min(volume, 1) * 0.22, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
    noise.stop(t + duration);
  } catch (e) {}
}

// Tactile Lens / Shutter Action Sound (Subtle mechanical air displacement when clicking cards/links)
export function playTactileLensClick(volume: number = 0.22) {
  if (isMuted()) return;
  try {
    const ctx = getSoundContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Optical Aperture Click
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(820, t);
    osc.frequency.exponentialRampToValueAtTime(95, t + 0.035);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1800, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.04);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(Math.min(volume, 1) * 0.35, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);

    // Micro Air Puff on release
    const noise = ctx.createBufferSource();
    noise.buffer = getPinkNoiseBuffer(ctx);
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(900, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(300, t + 0.06);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, t);
    noiseGain.gain.linearRampToValueAtTime(Math.min(volume, 1) * 0.15, t + 0.005);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);
    noise.stop(t + 0.07);
  } catch (e) {}
}
