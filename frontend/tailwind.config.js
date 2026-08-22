/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        odoo: {
          purple: '#714B67',
          teal: '#00A09D',
        }
      }
    },
  },
  plugins: [],
}
