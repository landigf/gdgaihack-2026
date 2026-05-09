import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        sidebar: "var(--sidebar)",
        elevated: "var(--elevated)",
        border: "var(--border)",
        separator: "var(--separator)",
        text: "var(--text)",
        muted: "var(--muted)",
        subtle: "var(--subtle)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-soft": "var(--accent-soft)",
        selected: "var(--selected)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "system-ui",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SF Mono", "Menlo", "Monaco", "monospace"],
      },
      fontSize: {
        // macOS-native scale, bumped one notch for readability
        "2xs": ["10px", { lineHeight: "14px" }],
        xs: ["11px", { lineHeight: "16px" }],
        sm: ["13px", { lineHeight: "18px" }],
        base: ["14px", { lineHeight: "20px" }],
        lg: ["16px", { lineHeight: "22px" }],
        xl: ["18px", { lineHeight: "24px" }],
        "2xl": ["22px", { lineHeight: "28px" }],
        "3xl": ["28px", { lineHeight: "34px" }],
      },
      boxShadow: {
        "macos-sm": "0 1px 2px rgba(0, 0, 0, 0.04), 0 0 0 0.5px rgba(0, 0, 0, 0.05)",
        "macos-md":
          "0 2px 6px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(0, 0, 0, 0.06)",
        "macos-lg":
          "0 6px 24px rgba(0, 0, 0, 0.10), 0 0 0 0.5px rgba(0, 0, 0, 0.08)",
        "focus-ring": "0 0 0 3px var(--accent-soft)",
      },
      borderRadius: {
        "macos-sm": "5px",
        macos: "8px",
        "macos-lg": "12px",
      },
      backdropBlur: {
        macos: "30px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(2px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-fast": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 180ms cubic-bezier(0.32, 0.72, 0, 1)",
        "fade-in-fast": "fade-in-fast 120ms ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
