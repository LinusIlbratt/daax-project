import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./theme/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "rgb(var(--theme-bg) / <alpha-value>)",
          surface: "rgb(var(--theme-surface) / <alpha-value>)",
          "surface-muted": "rgb(var(--theme-surface-muted) / <alpha-value>)",
          border: "rgb(var(--theme-border) / <alpha-value>)",
          "border-muted": "rgb(var(--theme-border-muted) / <alpha-value>)",
          text: "rgb(var(--theme-text) / <alpha-value>)",
          "text-muted": "rgb(var(--theme-text-muted) / <alpha-value>)",
          "text-subtle": "rgb(var(--theme-text-subtle) / <alpha-value>)",
          "text-inverse": "rgb(var(--theme-text-inverse) / <alpha-value>)",
          primary: "rgb(var(--theme-primary) / <alpha-value>)",
          "primary-hover": "rgb(var(--theme-primary-hover) / <alpha-value>)",
          "primary-muted": "rgb(var(--theme-primary-muted) / <alpha-value>)",
          "primary-fg": "rgb(var(--theme-primary-fg) / <alpha-value>)",
          accent: "rgb(var(--theme-accent) / <alpha-value>)",
          "accent-muted": "rgb(var(--theme-accent-muted) / <alpha-value>)",
          success: "rgb(var(--theme-success) / <alpha-value>)",
          error: "rgb(var(--theme-error) / <alpha-value>)",
          footer: "rgb(var(--theme-footer-bg) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        site: "var(--theme-max-width)",
      },
    },
  },
  plugins: [],
};

export default config;
