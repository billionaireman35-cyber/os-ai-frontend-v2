/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        'tablet': '768px',
        'landscape': '1024px',
      },
      colors: {
        void: '#0a0e12',
        panel: '#12171d',
        panel2: '#181f27',
        line: '#252d36',
        bone: '#e8e6df',
        muted: '#8b9299',
        brass: '#c9a86a',
        brassLight: '#ddc088',
        teal: '#3fa79b',
      },
    },
  },
  plugins: [],
}