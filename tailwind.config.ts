import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#e8fbff",
        line: "#a78bfa",
        paper: "#111226",
        brand: "#22d3ee",
        mint: "#8b5cf6",
        amber: "#c084fc"
      },
      boxShadow: {
        panel: "0 22px 70px rgba(10, 8, 35, 0.42)"
      }
    }
  },
  plugins: []
};

export default config;
