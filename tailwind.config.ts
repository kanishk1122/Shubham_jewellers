import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx,js,jsx}",
    "./src/pages/**/*.{ts,tsx,js,jsx}",
    "./src/components/**/*.{ts,tsx,js,jsx}",
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
  ],
  // Use class strategy so you can toggle theme with <html class="dark"> or via JS
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // semantic tokens you can use across the app (light/dark will be controlled via .dark class)
        background: {
          DEFAULT: "var(--tw-bg, #ffffff)",
          muted: "var(--tw-bg-muted, #f8fafc)",
        },
        foreground: {
          DEFAULT: "var(--tw-foreground, #0f172a)",
          muted: "var(--tw-foreground-muted, #475569)",
        },
        primary: {
          DEFAULT: "var(--tw-primary, #3b82f6)",
          foreground: "var(--tw-primary-foreground, #ffffff)",
        },
        // fallback palette
        neutral: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
        },
      },
      // small utilities to make transitions smoother on theme switch
      transitionProperty: {
        colors: "background-color, border-color, color, fill, stroke",
      },
      boxShadow: {
        card: "0 6px 18px rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
