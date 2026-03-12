/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './context/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#06080d',
          secondary: '#0d1117',
          card: '#161b22',
          hover: '#1c2333',
        },
        border: {
          DEFAULT: '#1e293b',
          hover: '#30363d',
        },
        accent: {
          DEFAULT: '#2dd4a8',
          hover: '#22c998',
          glow: 'rgba(45, 212, 168, 0.15)',
        },
        text: {
          primary: '#e6edf3',
          secondary: '#8b949e',
          muted: '#484f58',
        },
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
