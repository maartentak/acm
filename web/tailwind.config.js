/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F2F1EF', // warm light grey page
        card: '#FFFFFF',
        ink: '#0A0A0A', // near-black, primary + text
        'ink-soft': '#6B7280',
        'ink-faint': '#A1A1AA',
        line: '#E7E5E1', // hairline borders
        fill: '#F0EEEA', // nested panels / inputs / inactive pills
        danger: '#D7263D', // the single reserved accent (errors/destructive)
      },
      fontFamily: {
        // Body/UI text — clean and legible.
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        // Headings + numerals — light technical monospace, Nothing-OS feel.
        display: ['"DM Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        card: '28px',
        control: '20px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(10,10,10,0.04), 0 10px 30px -20px rgba(10,10,10,0.18)',
      },
      keyframes: {
        'rise-in': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: { 'rise-in': 'rise-in 0.35s cubic-bezier(0.22, 1, 0.36, 1)' },
    },
  },
  plugins: [],
}
