# Fonts

The render engine uses six open-licensed variable fonts, loaded locally (no CDN) for
reproducible renders. **The font binaries are not committed to this repo.** To match
the channel's exact look, download each as a `.woff2` and drop it here with these names:

| File name expected | Font | License | Source |
|---|---|---|---|
| `outfit.woff2` | Outfit | SIL OFL 1.1 | Google Fonts |
| `sora.woff2` | Sora | SIL OFL 1.1 | Google Fonts |
| `space-grotesk.woff2` | Space Grotesk | SIL OFL 1.1 | Google Fonts |
| `inter.woff2` | Inter | SIL OFL 1.1 | Google Fonts / rsms.me/inter |
| `geist-mono.woff2` | Geist Mono | SIL OFL 1.1 | Vercel Geist |
| `jetbrains-mono.woff2` | JetBrains Mono | SIL OFL 1.1 | JetBrains |

If a file is missing, the engine logs a warning and falls back to the system font
stack defined in `src/theme.ts` — it will still compile and render, just off-brand.
