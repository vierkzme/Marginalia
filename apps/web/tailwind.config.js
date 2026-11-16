/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          cream: '#F6F3EB',
          dark: '#111216',
        },
        paper: {
          light: '#F6F3EB',
          sepia: '#F4ECD8',
          cream: '#EFECE3',
        },
        ink: {
          dark: '#111216',
          elevated: '#1A1C22',
          surface: '#23262E',
          charcoal: '#141413',
          border: '#141413',
          darkBorder: '#3A3E4C',
          ivory: '#F6F3EB',
          graphite: '#6B6860',
          muted: '#6B6860',
          pewter: '#A8A49B',
        },
        violet: {
          brand: '#5B2DF5',
          hover: '#4C1D95',
          soft: '#EDE9FE',
          tint: '#F3EFFE',
          progress: '#DDD6FE',
          darkSoft: '#2E1D6B',
          bright: '#7C5CFF',
        },
        editorial: {
          rust: '#5B2DF5',
          orange: '#7C5CFF',
        },
        bauhaus: {
          red: '#E53935',
          blue: '#1565C0',
          yellow: '#FDD835',
          green: '#1E8E3E',
          navy: '#0B253A',
        },
        marker: {
          learning: '#FDE68A',
          learningBorder: '#D97706',
          leech: '#FECDD3',
          leechBorder: '#E11D48',
        },
      },
      boxShadow: {
        'brutal-lg': '0 5px 0 0 #141413',
        'brutal': '0 4px 0 0 #141413',
        'brutal-sm': '0 3px 0 0 #141413',
        'brutal-xs': '0 2px 0 0 #141413',
        'brutal-dark': '0 4px 0 0 #050505',
        'brutal-dark-sm': '0 3px 0 0 #050505',
        'brutal-dark-xs': '0 2px 0 0 #050505',
      },
      fontFamily: {
        serif: ['Newsreader', 'Lora', 'Merriweather', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      maxWidth: {
        reader: '65ch',
      },
    },
  },
  plugins: [],
};
