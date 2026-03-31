/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#0a0a0a',
          card: '#111111',
          surface: '#161616',
          input: '#1a1a1a',
          hover: '#1f1f1f',
        },
        accent: {
          DEFAULT: '#FACC15',
          hover: '#EAB308',
        }
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px rgba(250,204,21,0.3)',
        'brutal-sm': '2px 2px 0px 0px rgba(250,204,21,0.2)',
        'brutal-lg': '6px 6px 0px 0px rgba(250,204,21,0.4)',
        'brutal-hard': '4px 4px 0px 0px #FACC15',
        'brutal-black': '4px 4px 0px 0px rgba(0,0,0,1)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}
