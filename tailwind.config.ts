import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--tg-theme-button-color, #2563eb)",
          foreground: "var(--tg-theme-button-text-color, #ffffff)",
          hover: "#1d4ed8",
        },
        secondary: {
          DEFAULT: "var(--tg-theme-secondary-bg-color, #f1f5f9)",
          foreground: "#0f172a",
        },
        accent: {
          DEFAULT: "#0284c7",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "var(--tg-theme-hint-color, #64748b)",
          foreground: "#94a3b8",
        },
        card: {
          DEFAULT: "var(--tg-theme-bg-color, #ffffff)",
          foreground: "var(--tg-theme-text-color, #0f172a)",
        },
        border: "#e2e8f0",
        success: "#16a34a",
        warning: "#eab308",
        destructive: "#dc2626",
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
