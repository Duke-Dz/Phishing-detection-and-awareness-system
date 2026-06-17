/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cyber: {
          50: "#e8ecfd",
          100: "#c7d2fe",
          200: "#a5b4fc",
          300: "#818cf8",
          400: "#6366f1",
          500: "#4361ee",
          600: "#3730a3",
          700: "#312e81",
          800: "#1e1b4b",
          900: "#0A192F",
          950: "#060d1a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
