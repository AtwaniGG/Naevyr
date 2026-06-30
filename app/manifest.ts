import type { MetadataRoute } from "next";

// PWA manifest (Phase 2B) — makes Naevyr installable so it can receive web-push
// notifications (on iOS, push requires the PWA be added to the home screen).
// Icons come straight from the DS appicon exports, like the rest of the DOM art.
const ICONS = "/assets/design-system.nosync/assets/appicon";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Naevyr",
    short_name: "Naevyr",
    description: "A dark-fantasy play-to-earn MMO consumed by the Drift.",
    start_url: "/play",
    display: "standalone",
    background_color: "#0a0810",
    theme_color: "#0a0810",
    orientation: "any",
    icons: [
      { src: `${ICONS}/app_icon_192.svg`, sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      { src: `${ICONS}/app_icon_512.svg`, sizes: "512x512", type: "image/svg+xml", purpose: "any" },
      { src: `${ICONS}/app_icon_maskable_512.svg`, sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
