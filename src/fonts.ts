// Typography for the render engine.
//
// The faces are loaded from public/fonts/*.woff2 via staticFile() — no CDN call at
// render time, so a network outage can never stall a render or silently downgrade to
// a system font. This public repo does NOT ship the font binaries; see
// public/fonts/README.md for the (all open-licensed) faces to drop in. If a face is
// missing we fall back gracefully to the CSS stacks in theme.ts rather than aborting
// the render — so the engine compiles and renders out of the box either way.
import { continueRender, delayRender, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";

export const outfit = "Outfit";
export const sora = "Sora";
export const spaceGrotesk = "SpaceGrotesk";
export const inter = "Inter";
export const geistMono = "GeistMono";
export const jetBrainsMono = "JetBrainsMono";

// Each file is a variable font; this range exposes all of its weights to CSS.
const VARIABLE_RANGE = "100 900";

const face = (family: string, file: string) =>
  loadFont({
    family,
    url: staticFile(`fonts/${file}`),
    weight: VARIABLE_RANGE,
    style: "normal",
    format: "woff2",
    display: "block",
  }).catch(() => {
    // Font file not present -> fall back to the theme's CSS stack. Non-fatal by design.
    // eslint-disable-next-line no-console
    console.warn(`[fonts] ${family} (${file}) not found in public/fonts — using fallback.`);
  });

const handle = delayRender("Loading fonts");

Promise.all([
  face(outfit, "outfit.woff2"),
  face(sora, "sora.woff2"),
  face(spaceGrotesk, "space-grotesk.woff2"),
  face(inter, "inter.woff2"),
  face(geistMono, "geist-mono.woff2"),
  face(jetBrainsMono, "jetbrains-mono.woff2"),
]).finally(() => continueRender(handle));
