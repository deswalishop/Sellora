import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sellora brand palette (PRD section 5)
        emerald: {
          950: "#065F46", // primary deep emerald
        },
        brand: {
          DEFAULT: "#065F46",
          light: "#10B981",
          mint: "#D1FAE5",
        },
        ink: "#111827",
        muted: "#6B7280",
        canvas: "#F8FAFC",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
