// Visual themes for the render engine.
//
// the render-variance rule requires components to accept a `theme_id` so colours / fonts / layout
// vary per render -- this defeats YouTube's "mass-produced template" visual hashing.
// Base palette = "The Validation Set" brand (see the brand asset script):
//   bg #0B0F19 -> #05070D, mint #26F0AA, violet #7C6CFF, text #EAF0F8, muted #94A5C4.

import { outfit, sora, spaceGrotesk, inter, geistMono, jetBrainsMono } from "./fonts";

export interface Theme {
  id: string;
  bgFrom: string;
  bgTo: string;
  accent: string;
  secondary: string;
  text: string;
  muted: string;
  grid: string;
  panel: string;
  fontDisplay: string;
  fontMono: string;
  titleAlign: "left" | "center";
}

// The real faces are loaded in ./fonts via @remotion/google-fonts; Remotion blocks
// frame rendering until each is ready, so these stacks resolve to the actual fonts
// (not system fallbacks) across the whole video and the Thumbnail still. Loaded Inter
// and the system mono stack are graceful fallbacks while/if a face is unavailable.
const SANS = `${inter}, system-ui, sans-serif`;
const MONO = `ui-monospace, "SFMono-Regular", monospace`;
const OUTFIT = `${outfit}, ${SANS}`;
const SORA = `${sora}, ${SANS}`;
const GROTESK = `${spaceGrotesk}, ${SANS}`;
const GEIST = `${geistMono}, ${MONO}`;
const JETBRAINS = `${jetBrainsMono}, ${MONO}`;

const BASE = {
  bgFrom: "#0B0F19",
  bgTo: "#05070D",
  text: "#EAF0F8",
  muted: "#94A5C4",
  grid: "rgba(120, 150, 200, 0.12)",
  panel: "#0B0F19",
};

export const THEMES: Theme[] = [
  { ...BASE, id: "vs-mint", accent: "#26F0AA", secondary: "#7C6CFF", fontDisplay: OUTFIT, fontMono: GEIST, titleAlign: "left" },
  { ...BASE, id: "vs-violet", accent: "#7C6CFF", secondary: "#26F0AA", fontDisplay: SORA, fontMono: GEIST, titleAlign: "center" },
  { ...BASE, id: "vs-cyan", accent: "#38BDF8", secondary: "#7C6CFF", fontDisplay: GROTESK, fontMono: JETBRAINS, titleAlign: "left" },
  { ...BASE, id: "vs-amber", accent: "#F5B546", secondary: "#FB7185", fontDisplay: OUTFIT, fontMono: JETBRAINS, titleAlign: "center" },
  { ...BASE, id: "vs-rose", accent: "#FB7185", secondary: "#38BDF8", fontDisplay: SORA, fontMono: GEIST, titleAlign: "left" },
  { ...BASE, id: "vs-teal", accent: "#2DD4BF", secondary: "#A78BFA", fontDisplay: GROTESK, fontMono: GEIST, titleAlign: "center" },
];

/** Stable non-negative hash of a render id (number used directly, string hashed). */
export function hashId(themeId?: string | number): number {
  if (themeId === undefined || themeId === null) return 0;
  if (typeof themeId === "number" && Number.isFinite(themeId)) {
    return Math.abs(Math.trunc(themeId));
  }
  const s = String(themeId);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Deterministically pick a theme from a number or string id (stable per render). */
export function getTheme(themeId?: string | number): Theme {
  return THEMES[hashId(themeId) % THEMES.length];
}

/** "#26F0AA" -> "38, 240, 170" for use inside rgba(). */
export function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

// ---------------------------------------------------------------------------
// Structural variance -- vary LAYOUT/geometry per render (not just colour) so a
// run of videos can't be fingerprinted as one repeated template. Deterministic in
// themeId, so a render stays fully reproducible.
// ---------------------------------------------------------------------------

export type StatAlign = "center" | "left";
export type AccentMotif = "tick" | "bar" | "dot";
export type EntranceStyle = "lift" | "scale";

export interface Variant {
  statAlign: StatAlign;
  accentMotif: AccentMotif;
  entrance: EntranceStyle;
  /** Multiplier on a chart's top padding so plot geometry shifts per render. */
  chartPadTopScale: number;
}

const MOTIFS: AccentMotif[] = ["tick", "bar", "dot"];

/** Deterministic per-render geometry, decorrelated from the colour theme. */
export function getVariant(themeId?: string | number): Variant {
  const h = hashId(themeId);
  return {
    statAlign: h % 2 === 0 ? "center" : "left",
    accentMotif: MOTIFS[Math.floor(h / 2) % MOTIFS.length] ?? "tick",
    entrance: Math.floor(h / 6) % 2 === 0 ? "lift" : "scale",
    chartPadTopScale: 0.92 + ((h % 5) / 4) * 0.16,
  };
}
