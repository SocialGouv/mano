/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  safelist: [
    'tw-min-w-0',
  ],
  theme: {
    extend: {
      colors: {
        main: '#008e7f', // higher contrast
        main75: '#49c3a6',
        main50: '#94c7bf',
        main25: '#c7e1dd',
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
      borderColor: (theme) => ({
        DEFAULT: theme('colors.black'),
        dark: {
          DEFAULT: theme('colors.white'),
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      // strategy: 'base', // only generate global styles
      /* When using the class strategy, form elements are not styled globally,
       and instead must be styled using the generated form-{name} classes. */
      strategy: 'class', // only generate classes
    }),
  ],
  prefix: 'tw-',
};
