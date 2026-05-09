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
        details: "var(--details)",
        elevated: "var(--elevated)",
        border: "var(--border)",
        separator: "var(--separator)",
        text: "var(--text)",
        muted: "var(--muted)",
        subtle: "var(--subtle)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-soft": "var(--accent-soft)",
        "accent-tint": "var(--accent-tint)",
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
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Inter Display",
          "system-ui",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SF Mono", "Menlo", "Monaco", "monospace"],
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px", letterSpacing: "0.02em" }],
        xs: ["11px", { lineHeight: "16px" }],
        sm: ["13px", { lineHeight: "18px" }],
        base: ["14px", { lineHeight: "20px" }],
        lg: ["16px", { lineHeight: "22px" }],
        xl: ["18px", { lineHeight: "24px" }],
        "2xl": ["22px", { lineHeight: "28px", letterSpacing: "-0.015em" }],
        "3xl": ["28px", { lineHeight: "34px", letterSpacing: "-0.022em" }],
        "4xl": ["34px", { lineHeight: "40px", letterSpacing: "-0.025em" }],
        "5xl": ["44px", { lineHeight: "50px", letterSpacing: "-0.028em" }],
      },
      boxShadow: {
        "macos-sm": "0 1px 2px rgba(0, 0, 0, 0.04), 0 0 0 0.5px rgba(0, 0, 0, 0.05)",
        "macos-md":
          "0 2px 6px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(0, 0, 0, 0.06)",
        "macos-lg":
          "0 8px 28px rgba(0, 0, 0, 0.10), 0 0 0 0.5px rgba(0, 0, 0, 0.06)",
        glow: "0 0 0 4px var(--accent-soft), 0 8px 24px var(--accent-tint)",
      },
      borderRadius: {
        "macos-sm": "6px",
        macos: "10px",
        "macos-lg": "14px",
        "macos-xl": "18px",
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
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "ring-pulse": {
          "0%": {
            boxShadow:
              "0 0 0 0 var(--accent-soft), 0 0 0 0 var(--accent-soft)",
          },
          "70%": {
            boxShadow:
              "0 0 0 8px transparent, 0 0 0 14px transparent",
          },
          "100%": {
            boxShadow:
              "0 0 0 0 transparent, 0 0 0 0 transparent",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 220ms cubic-bezier(0.32, 0.72, 0, 1)",
        "fade-in-fast": "fade-in-fast 140ms ease-out",
        "scale-in": "scale-in 240ms cubic-bezier(0.32, 0.72, 0, 1)",
        shimmer: "shimmer 1.6s linear infinite",
        "pulse-soft": "pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ring-pulse": "ring-pulse 2.4s cubic-bezier(0.32, 0.72, 0, 1) infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
