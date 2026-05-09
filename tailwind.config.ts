import type { Config } from "tailwindcss";

/* The Rover design system lives in src/index.css as raw CSS variables and
   classes. Tailwind here exists only for low-level layout utilities (flex,
   grid, gap) — we do not map design tokens to Tailwind colors anymore. */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
