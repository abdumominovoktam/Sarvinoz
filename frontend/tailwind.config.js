/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#007A63',
          dark: '#005F4F',
          light: '#E6F4F1',
          accent: '#D1ECE6',
        },
        surface: {
          bg: '#F7FBFA',
          card: '#FFFFFF',
          border: '#D6E5E1',
        },
        ink: {
          DEFAULT: '#17211F',
          secondary: '#64716D',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 2px 12px -2px rgba(0, 95, 79, 0.06), 0 1px 4px -1px rgba(0, 0, 0, 0.03)',
        'elevated': '0 10px 25px -5px rgba(0, 95, 79, 0.10), 0 4px 10px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
