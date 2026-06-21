/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cyber: {
          50: "#eef6fc",
          100: "#d9eaf7",
          200: "#b8d7ed",
          300: "#7fb5dc",
          400: "#3f8fc2",
          500: "#176da3",
          600: "#0D518C",
          700: "#0a477a",
          800: "#083a66",
          900: "#020617",
          950: "#000000",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
