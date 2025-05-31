/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "terminal-green": {
          DEFAULT: "#00FF00",
          50: "rgb(0 255 0 / 0.05)",
          100: "rgb(0 255 0 / 0.1)",
          200: "rgb(0 255 0 / 0.2)",
          300: "rgb(0 255 0 / 0.3)",
          400: "rgb(0 255 0 / 0.4)",
          500: "rgb(0 255 0 / 0.5)",
          600: "rgb(0 255 0 / 0.6)",
          700: "rgb(0 255 0 / 0.7)",
          800: "rgb(0 255 0 / 0.8)",
          900: "rgb(0 255 0 / 0.9)",
        },
      },
      opacity: {
        15: "0.15",
      },
    },
  },
  plugins: [],
};
