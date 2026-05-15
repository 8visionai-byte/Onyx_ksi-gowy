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
        onyx: {
          bg: "#0f172a",
          card: "#1e293b",
          border: "#334155",
          text: "#e2e8f0",
          muted: "#94a3b8",
          accent: "#3b82f6",
        },
      },
    },
  },
  plugins: [],
};

export default config;
