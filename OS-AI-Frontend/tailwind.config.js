/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: '#0A1114',
        panel: '#121B1E',
        panel2: '#0D1518',
        line: '#1E2A2C',
        brass: '#C98A3E',
        brassLight: '#D89A4E',
        teal: '#2FBFA0',
        bone: '#E9E4D8',
        muted: '#7C8683',
        alert: '#C1524A',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      screens: {
        tablet: '768px',
        landscape: '1024px',
      },
      keyframes: {
        ticker: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        ticker: 'ticker 28s linear infinite',
      },
    },
  },
  plugins: [],
}
