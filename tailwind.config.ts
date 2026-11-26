import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        crypt: "#0a0a0f",
        tomb: "#15151c",
        pumpkin: "#ff6b1a",
        ghost: "#a8e6cf",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "0.95" },
          "50%": { opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        progress: {
          from: { width: "0%" },
          to: { width: "90%" },
        },
        "modal-in": {
          from: { opacity: "0", transform: "translateY(12px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        flicker: "flicker 8s ease-in-out infinite",
        "fade-in": "fade-in 400ms ease-in both",
        progress: "progress 12s cubic-bezier(0.1, 0.6, 0.2, 1) forwards",
        shimmer: "shimmer 1.8s linear infinite",
        "spin-slow": "spin 3s linear infinite",
        "modal-in": "modal-in 250ms ease-out both",
      },
      fontFamily: {
        sans: [
          "var(--font-geist-sans)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        display: ["var(--font-cinzel)", "Georgia", "serif"],
        mono: [
          "var(--font-jetbrains-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
