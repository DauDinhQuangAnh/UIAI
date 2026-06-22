import type { Config } from "tailwindcss";

// Theme contract: every color/radius/shadow references a CSS variable defined once
// in src/styles/tokens.css (single source of truth — no raw hex in components).
// shadcn's --background/--foreground/--primary/... vars are aliased there too.
const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // shadcn semantic contract
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        popover: { DEFAULT: "var(--popover)", foreground: "var(--popover-foreground)" },
        primary: { DEFAULT: "var(--primary)", foreground: "var(--primary-foreground)" },
        secondary: { DEFAULT: "var(--secondary)", foreground: "var(--secondary-foreground)" },
        muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        accent: { DEFAULT: "var(--accent)", foreground: "var(--accent-foreground)" },
        destructive: { DEFAULT: "var(--destructive)", foreground: "var(--destructive-foreground)" },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        // brand coral ramp
        brand: {
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          200: "var(--brand-200)",
          300: "var(--brand-300)",
          400: "var(--brand-400)",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
          800: "var(--brand-800)",
        },
        // warm-stone neutrals (direct token access for non-shadcn surfaces)
        surface: { DEFAULT: "var(--surface)", 2: "var(--surface-2)" },
        "border-strong": "var(--border-strong)",
        "text-primary": "var(--text)",
        "text-secondary": "var(--text-secondary)",
        "text-dim": "var(--text-dim)",
        // semantic status (fg/bg/border)
        success: { fg: "var(--success-fg)", bg: "var(--success-bg)", border: "var(--success-border)", base: "var(--success-base)" },
        warning: { fg: "var(--warning-fg)", bg: "var(--warning-bg)", border: "var(--warning-border)", base: "var(--warning-base)" },
        danger: { fg: "var(--danger-fg)", bg: "var(--danger-bg)", border: "var(--danger-border)", base: "var(--danger-base)" },
        info: { fg: "var(--info-fg)", bg: "var(--info-bg)", border: "var(--info-border)", base: "var(--info-base)" },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-lg)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        focus: "var(--shadow-focus)",
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Be Vietnam Pro", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "1.5" }],
        sm: ["14px", { lineHeight: "1.5" }],
        base: ["16px", { lineHeight: "1.5" }],
        lg: ["18px", { lineHeight: "1.5" }],
        xl: ["20px", { lineHeight: "1.3" }],
        "2xl": ["24px", { lineHeight: "1.25" }],
        "3xl": ["30px", { lineHeight: "1.2" }],
        "4xl": ["38px", { lineHeight: "1.15" }],
      },
      transitionTimingFunction: {
        brand: "cubic-bezier(.2,.8,.2,1)",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        blob: {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(30px,-20px) scale(1.05)" },
          "66%": { transform: "translate(-20px,14px) scale(0.96)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(22px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 1.4s ease-in-out infinite",
        blob: "blob 9s ease-in-out infinite",
        "blob-slow": "blob 13s ease-in-out infinite",
        "blob-slower": "blob 17s ease-in-out infinite",
        "fade-up": "fade-up 0.55s ease-out forwards",
        "fade-in": "fade-in 0.4s ease-out forwards",
      },
    },
  },
  // tailwindcss-animate is replaced by tw-animate-css (Tailwind v4 compatible),
  // imported in src/styles/globals.css. Typography stays as a JS plugin.
  plugins: [require("@tailwindcss/typography")],
};

export default config;
