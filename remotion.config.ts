import { Config } from "@remotion/cli/config";

// High-quality output: PNG frames + low CRF so text/charts stay crisp before
// the platform re-encode. Mirrors the production render settings.
Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);
Config.setCodec("h264");
Config.setCrf(16);
