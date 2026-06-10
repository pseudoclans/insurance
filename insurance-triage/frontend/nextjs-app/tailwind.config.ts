import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1E3A5F",
        "primary-light": "#2A5298",
        accent: "#3B82F6",
        "accent-hover": "#2563EB",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        surface: "#F8FAFC",
        "surface-dark": "#F1F5F9",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
