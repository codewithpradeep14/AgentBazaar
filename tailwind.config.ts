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
        background: "#FAF8F5",
        surface: "#FFFFFF",
        "surface-soft": "#F5F2EB",
        "surface-subtle": "#EFECE6",
        border: "#E5E0D5",
        "border-strong": "#CFC8B8",
        charcoal: {
          900: "#141413",
          800: "#1C1917",
          700: "#292524",
          600: "#44403C",
          500: "#78716C",
          400: "#A8A29E",
          300: "#D6D3D1",
        },
        forest: {
          900: "#0D2818",
          800: "#1B4332",
          700: "#2D6A4F",
          600: "#40916C",
          500: "#52B788",
          100: "#D8F3DC",
          50: "#EDF9F0",
        },
        cobalt: {
          900: "#172554",
          800: "#1E3A8A",
          700: "#1D4ED8",
          600: "#2563EB",
          500: "#3B82F6",
          100: "#DBEAFE",
          50: "#EFF6FF",
        },
        hsk: {
          gold: "#D4AF37",
          dark: "#1A1A1A",
          accent: "#2A9D8F",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        editorial: ["Georgia", "Cambria", "Times New Roman", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "Liberation Mono", "monospace"],
      },
      animation: {
        "mesh-slow": "meshMove 28s ease-in-out infinite alternate",
        "pulse-subtle": "pulseSubtle 4s ease-in-out infinite",
      },
      keyframes: {
        meshMove: {
          "0%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(-30px, 20px) scale(1.04)" },
          "100%": { transform: "translate(20px, -20px) scale(0.98)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.75" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
