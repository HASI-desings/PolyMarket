/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#050607",
          900: "#0b0d10",
          850: "#101317",
          800: "#161a1f",
          700: "#22272e",
          600: "#2f363f",
        },
        mint: {
          400: "#3ee6a8",
          500: "#22d3a0",
          600: "#16b087",
        },
        coral: {
          400: "#ff6b6b",
          500: "#f0475a",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -12px rgba(62, 230, 168, 0.35)",
      },
    },
  },
  plugins: [],
};
