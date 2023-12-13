/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        main: '#226854', // higher contrast
        main75: '#617e71',
        main50: '#95a9a0',
        main25: '#cad4cf',
        black: '#1D2021',
        black75: '#3b3b3b',
        black50: '#777777',
        black25: '#b9b9b9',
        black05: '#F7F9FA',
        white: '#FFFFFF',
        redDark: '#F5222D',
        redLight: '#FBE4E4',
        orangeLight: '#FEF3C7',
        orangeDark: '#D97706',
      },
    },
  },
  plugins: [],
};
