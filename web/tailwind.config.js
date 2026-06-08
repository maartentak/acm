/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Canvas + light surfaces
        cream: '#E4E2DD',
        paper: '#FFFFFF',
        // Dark "bento" surfaces
        espresso: '#2C1D11',
        'espresso-2': '#3A2818',
        // Brand
        orange: '#F97316',
        amber: '#D97706',
        // Text on light canvas
        ink: '#111827',
        'ink-soft': '#4B5563',
        line: '#E5E7EB',
        // Text on dark surfaces
        sand: '#EDE7DF',
        'sand-soft': '#A99E8E',
        // Feedback
        danger: '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        card: '32px',
        control: '24px',
      },
      boxShadow: {
        bento: '0 18px 40px -24px rgba(44, 29, 17, 0.45)',
        lift: '0 10px 30px -12px rgba(44, 29, 17, 0.35)',
      },
      keyframes: {
        'rise-in': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'rise-in': 'rise-in 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
