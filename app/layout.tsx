import type { Metadata, Viewport } from "next";
import { Pixelify_Sans, Silkscreen, Sora } from "next/font/google";
import "./globals.css";
import "./naevyr.css";
import BgMusic from "@/components/BgMusic";
import ErrorOverlay from "@/components/ErrorOverlay";

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

export const metadata: Metadata = {
  title: "Naevyr",
  description: "A dark-fantasy play-to-earn MMO consumed by the Drift.",
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
      <body className={`${pixelify.variable} ${silkscreen.variable} ${sora.variable}`}>
        {children}
        <ErrorOverlay />
        <BgMusic />
      </body>
    </html>
  );
}
