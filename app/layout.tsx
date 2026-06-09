import type { Metadata } from "next";
import { Pixelify_Sans, Silkscreen, Sora } from "next/font/google";
import "./globals.css";
import "./driftlands.css";

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
  title: "Driftlands",
  description: "A dark-fantasy play-to-earn MMO consumed by the Drift.",
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
      </body>
    </html>
  );
}
