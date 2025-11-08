/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "udo-primary": "#0044ff",
        "udo-steel": "#6b7280",
        "udo-bg": "#f9fafb"
      }
    }
  },
  plugins: []
};
