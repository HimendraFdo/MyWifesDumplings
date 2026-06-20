import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Shadcn color mappings — resolved from CSS variables */
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        /* Brand design tokens */
        brand: {
          red: "#C0392B",
          "red-dark": "#922B21",
          "red-light": "#E74C3C",
          cream: "#F5E6D3",
          "cream-dark": "#EDD9C0",
          ink: "#1A0A00",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        ransom: ["var(--font-ransom)", "monospace"],
        "ransom-b": ["var(--font-ransom-b)", "sans-serif"],
      },
      backgroundImage: {
        "paper-texture": "url('/textures/paper.png')",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        stamp: {
          "0%": { opacity: "0", transform: "scale(1.3) rotate(-3deg)" },
          "70%": { opacity: "1", transform: "scale(0.95) rotate(1deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(0deg)" },
        },
        /* Dynamic scatter motion — gentle drifting so decorations feel alive */
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(var(--deco-rot, 0deg))" },
          "50%": { transform: "translateY(-12px) rotate(calc(var(--deco-rot, 0deg) + 2deg))" },
        },
        sway: {
          "0%, 100%": { transform: "rotate(var(--deco-rot, 0deg))" },
          "50%": { transform: "rotate(calc(var(--deco-rot, 0deg) - 5deg))" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0) rotate(var(--deco-rot, 0deg))" },
          "33%": { transform: "translate(6px, -8px) rotate(calc(var(--deco-rot, 0deg) + 3deg))" },
          "66%": { transform: "translate(-5px, -4px) rotate(calc(var(--deco-rot, 0deg) - 2deg))" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
        stamp: "stamp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
        float: "float 7s ease-in-out infinite",
        sway: "sway 6s ease-in-out infinite",
        drift: "drift 9s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
