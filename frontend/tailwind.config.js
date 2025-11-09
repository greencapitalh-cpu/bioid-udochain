/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "udo-primary": "#0f172a",
        "udo-steel": "#64748b"
      }
    }
  },
  plugins: []
};
