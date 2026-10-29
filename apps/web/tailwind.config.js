/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          light: '#FAF7F0',
          sepia: '#F4ECD8',
          cream: '#F2ECE1',
        },
        ink: {
          dark: '#111318',
          elevated: '#1A1D24',
          surface: '#20242C',
          charcoal: '#1C1917',
          ivory: '#F5F2EB',
          graphite: '#57534E',
          pewter: '#A8A29E',
        },
        editorial: {
          rust: '#9A3412',
          orange: '#EA580C',
        },
        marker: {
          learning: '#FDE68A',
          learningBorder: '#D97706',
          leech: '#FECDD3',
          leechBorder: '#E11D48',
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'Lora', 'Merriweather', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      maxWidth: {
        'reader': '65ch',
      },
    },
  },
  plugins: [],
};
