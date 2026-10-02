import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        parkx: {
          pink: "#FF2D78",
          "pink-light": "#FF5C98",
          "pink-dark": "#D8135C",
          "pink-glow": "rgba(255, 45, 120, 0.4)",
          black: "#06070B",
          dark: "#0B0E14",
          surface: "#10141E",
          card: "#141925",
          border: "#1E2638",
          "border-bright": "#2E3A54",
          green: "#00FF87",
          amber: "#FFB800",
          cyan: "#38BDF8",
          red: "#FF334B",
        },
        primary: {
          DEFAULT: "#FF2D78",
          foreground: "#ffffff",
          50: "#fff1f5",
          100: "#ffe4ec",
          500: "#FF2D78",
          600: "#E61A65",
          700: "#C20D4F",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "'Helvetica Neue'",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "'Liberation Mono'",
          "'Courier New'",
          "monospace",
        ],
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scanline": "scanline 8s linear infinite",
        "radar": "radar 4s linear infinite",
        "marquee": "marquee 25s linear infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
        radar: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        glow: {
          "0%": { filter: "drop-shadow(0 0 8px rgba(255, 45, 120, 0.4))" },
          "100%": { filter: "drop-shadow(0 0 24px rgba(255, 45, 120, 0.8))" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
