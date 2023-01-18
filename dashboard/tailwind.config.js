/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  safelist: ['tw-min-w-0'],

  theme: {
    extend: {
      animation: {
        coucou: 'coucou 2s ease-in-out 0s infinite',
        brrrr: 'brrrr 5s ease-in-out 0s infinite',
      },
      keyframes: {
        coucou: {
          '0%, 20%, 40%': { transform: 'rotate(-30deg)' },
          '10%, 30%': { transform: 'rotate(30deg)' },
          '50%': { transform: 'rotate(0deg)' },
        },
        brrrr: {
          '0%, 2%, 4%, 6%, 8%, 10%, 12%, 14%, 16%, 18%': { transform: 'rotate(-2deg)' },
          '1%, 3%, 5%, 7%, 9%, 11%, 13%, 15%, 17%, 19%': { transform: 'rotate(2deg)' },
          '20%': { transform: 'rotate(0deg)' },
        },
      },
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
