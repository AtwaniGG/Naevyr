import type { Metadata, Viewport } from "next";
import { Pixelify_Sans, Silkscreen, Sora, Space_Mono, Jacquard_12 } from "next/font/google";
import "./globals.css";
import "./naevyr.css";
import BgMusic from "@/components/BgMusic";

const pixelify = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-pixelify",
});

const silkscreen = Silkscreen({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-silkscreen",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sora",
});

// Used only by the /roadmap "Long Road" page: Space Mono = body, Jacquard 12 =
// one decorative endcap glyph. Scoped under #nvr-road in app/roadmap/roadmap.css.
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

const jacquard = Jacquard_12({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-jacquard",
});

export const metadata: Metadata = {
  title: "Naevyr",
  description: "A dark-fantasy play-to-earn MMO consumed by the Drift.",
  // PWA: installable so it can receive web-push (iOS needs home-screen install)
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Naevyr", statusBarStyle: "black-translucent" },
  icons: {
    icon: "/assets/design-system.nosync/assets/appicon/app_icon_192.svg",
    apple: "/assets/design-system.nosync/assets/appicon/app_icon_192.svg",
  },
};

// viewportFit=cover exposes env(safe-area-inset-*) so the mobile HUD can dodge
// the iPhone notch/home-bar; locking scale keeps the canvas owning all gestures
// (the engine handles pinch-zoom itself — see game.ts bindEvents).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0810",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${pixelify.variable} ${silkscreen.variable} ${sora.variable} ${spaceMono.variable} ${jacquard.variable}`}>
        {children}
        <BgMusic />
      </body>
    </html>
  );
}
