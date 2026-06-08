/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#07080b',
        'ink-elevated': '#111318',
        'ink-card': '#15171d',
        'ink-border': '#24272f',
        'on-ink': '#f4f6fa',
        'on-ink-muted': '#9aa1ad',
        'on-ink-faint': '#606673',
        accent: '#2f6bff',
        'accent-bright': '#5c8dff',
        'accent-deep': '#0a1430',
        success: '#3ddc97',
        warning: '#ffb454',
        danger: '#ff6b6b',
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
