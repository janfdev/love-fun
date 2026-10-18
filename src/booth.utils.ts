export type FilterKind =
  | "normal"
  | "beauty-glow"
  | "soft-peach"
  | "bw-classic"
  | "vintage-warm"
  | "cyber-pop"
  | "warm-sunset"
  | "pastel-dream";

export type FrameTheme =
  | "blush-pink"
  | "cream-pearl"
  | "midnight-noir"
  | "lavender-haze"
  | "matcha-mint"
  | "custom";

export type GridLayout = "3x1" | "4x1" | "2x2" | "2x3" | "6x1";

export type FontTheme = "sans" | "serif" | "mono" | "cursive";

export interface StripMetrics {
  width: number;
  height: number;
  pad: number;
  photoW: number;
  photoH: number;
  footerH: number;
  columns: number;
  rows: number;
}

export interface PlacedSticker {
  id: string;
  emoji: string;
  xPercent: number; // 0..100
  yPercent: number; // 0..100
  size: number;
}

export function getLayoutConfig(layout: GridLayout = "3x1", fallbackCount = 3) {
  switch (layout) {
    case "3x1":
      return { columns: 1, rows: 3, totalShots: 3 };
    case "4x1":
      return { columns: 1, rows: 4, totalShots: 4 };
    case "2x2":
      return { columns: 2, rows: 2, totalShots: 4 };
    case "2x3":
      return { columns: 2, rows: 3, totalShots: 6 };
    case "6x1":
      return { columns: 1, rows: 6, totalShots: 6 };
    default:
      return { columns: 1, rows: fallbackCount, totalShots: fallbackCount };
  }
}

export function calcStripMetrics(
  shotCount: number,
  photoW = 640,
  photoH = 480,
  layout: GridLayout = "3x1"
): StripMetrics {
  const pad = 32;
  const footerH = 96;
  const { columns, rows } = getLayoutConfig(layout, shotCount);

  // If layout is single column 3x1 or 4x1 with different shotCount, adjust rows
  const actualRows = layout === "2x2" || layout === "2x3" ? rows : Math.max(1, shotCount);
  const actualCols = layout === "2x2" || layout === "2x3" ? columns : 1;

  const width = pad + actualCols * (photoW + pad);
  const height = pad + actualRows * (photoH + pad) + footerH;

  return { width, height, pad, photoW, photoH, footerH, columns: actualCols, rows: actualRows };
}

export const FILTER_CSS: Record<FilterKind, string> = {
  normal: "none",
  "beauty-glow": "brightness(108%) contrast(106%) saturate(110%)",
  "soft-peach": "sepia(20%) saturate(120%) brightness(105%) hue-rotate(-8deg)",
  "bw-classic": "grayscale(100%) contrast(120%) brightness(98%)",
  "vintage-warm": "sepia(45%) contrast(110%) brightness(96%) saturate(90%)",
  "cyber-pop": "contrast(130%) saturate(145%) hue-rotate(20deg)",
  "warm-sunset": "brightness(106%) contrast(108%) saturate(125%) sepia(18%)",
  "pastel-dream": "brightness(112%) contrast(98%) saturate(105%) hue-rotate(6deg)",
};

export const FRAME_STYLES: Record<
  FrameTheme,
  { bg: string; text: string; sub: string; border: string; label: string }
> = {
  "blush-pink": {
    bg: "#FFF1F2",
    text: "#E11D48",
    sub: "#FB7185",
    border: "#FECDD3",
    label: "Blush Pink",
  },
  "cream-pearl": {
    bg: "#FFFDF9",
    text: "#27272A",
    sub: "#71717A",
    border: "#F4EFE6",
    label: "Cream Pearl",
  },
  "midnight-noir": {
    bg: "#09090B",
    text: "#FAFAFA",
    sub: "#A1A1AA",
    border: "#27272A",
    label: "Midnight Noir",
  },
  "lavender-haze": {
    bg: "#FAF5FF",
    text: "#7E22CE",
    sub: "#C084FC",
    border: "#E9D5FF",
    label: "Lavender",
  },
  "matcha-mint": {
    bg: "#F0FDF4",
    text: "#15803D",
    sub: "#4ADE80",
    border: "#DCFCE7",
    label: "Matcha Mint",
  },
  custom: {
    bg: "#FFFFFF",
    text: "#2B2D42",
    sub: "#7D7F9A",
    border: "#E2E8F0",
    label: "Custom Canvas / Canva",
  },
};

export const STICKER_PRESETS = [
  { id: "sparkles", emoji: "✨", label: "Sparkles" },
  { id: "heart", emoji: "💖", label: "Pink Heart" },
  { id: "ribbon", emoji: "🎀", label: "Ribbon" },
  { id: "cherries", emoji: "🍒", label: "Cherries" },
  { id: "cat", emoji: "🐱", label: "Kitty" },
  { id: "star", emoji: "⭐", label: "Star" },
  { id: "butterfly", emoji: "🦋", label: "Butterfly" },
  { id: "tulip", emoji: "🌷", label: "Tulip" },
  { id: "fire", emoji: "🔥", label: "Flame" },
  { id: "camera", emoji: "📸", label: "Snapshot" },
  { id: "clover", emoji: "🍀", label: "Lucky" },
  { id: "love-letter", emoji: "💌", label: "Love Letter" },
];

/**
 * Audio Synthesizer (Web Audio API)
 * Zero external MP3 downloads required.
 */
class SoundEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playBeep() {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  playShutter() {
    const ctx = this.getContext();
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }
}

export const Sound = new SoundEngine();
