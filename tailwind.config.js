/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        'phone': '360px', 'mobile': '480px', 'tablet': '768px',
        'landscape': '1024px', 'laptop': '1280px', 'desktop': '1536px'
      },
      colors: {
        void: 'var(--bg-main)',
        bone: 'var(--text-main)',
        line: 'var(--border)',
        panel: 'var(--bg-panel)',
        card: 'var(--bg-card)',
        accent: 'var(--accent)',
        muted: 'var(--text-muted)'
      }
    }
  },
  plugins: []
}
