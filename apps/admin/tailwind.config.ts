import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        admin: {
          bg: "rgb(var(--admin-bg))",
          surface: "rgb(var(--admin-surface))",
          border: "rgb(var(--admin-border))",
          "text": "rgb(var(--admin-text))",
          "text-muted": "rgb(var(--admin-text-muted))",
          primary: "rgb(var(--admin-primary))",
          "primary-muted": "rgb(var(--admin-primary-muted))",
          sidebar: "rgb(var(--admin-sidebar))",
          "sidebar-hover": "rgb(var(--admin-sidebar-hover))",
          "sidebar-active": "rgb(var(--admin-sidebar-active))",
        },
      },
      borderRadius: {
        admin: "var(--admin-radius)",
        "admin-lg": "var(--admin-radius-lg)",
      },
      boxShadow: {
        admin: "var(--admin-shadow)",
        "admin-md": "var(--admin-shadow-md)",
        "admin-lg": "var(--admin-shadow-lg)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-in-right": "slideInRight 0.25s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
