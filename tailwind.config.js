/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "terminal-green": "#00FF00",
      },
      opacity: {
        15: "0.15",
      },
    },
  },
  plugins: [],
};
