import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      screens: {
        'phone': '360px', 'mobile': '480px', 'tablet': '768px',
        'landscape': '1024px', 'laptop': '1280px', 'desktop': '1536px'
      },
      colors: {
        void: 'var(--bg-primary)',
        bone: 'var(--text-primary)',
        line: 'var(--border-color)',
        panel: 'var(--bg-secondary)',
        card: 'var(--bg-tertiary)',
        accent: 'var(--accent-brass)',
        muted: 'var(--text-muted)'
      }
    }
  },
  plugins: [typography]
}
