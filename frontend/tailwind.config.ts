import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#C6F61A", // lime-ish accent like screenshot
          dark: "#A4D410",
        },
        bg: {
          DEFAULT: "#0F1115",
          soft: "#13161B",
          panel: "#171A20",
        },
      },
      borderRadius: {
        xl: "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
