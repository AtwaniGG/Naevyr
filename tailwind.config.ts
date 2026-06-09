import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        drift: {
          // dark-fantasy decay palette
          void: "#0a0810",
          ash: "#171320",
          stone: "#2a2438",
          bone: "#d8cfe0",
          corrupt: "#a855f7", // the Drift glow
          corruptDim: "#6b21a8",
          ember: "#f59e0b",
          blood: "#dc2626",
          moss: "#4d7c4d",
          gold: "#e7c873",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        glow: "0 0 16px rgba(168,85,247,0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
