/** @type {import('tailwindcss').Config} */

export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  safelist: [
    "tw-min-w-0",
    // for line rows in DocumentsOrganizer, we need predefined paddings
    "before:-tw-left-0",
    "before:-tw-left-10",
    "before:-tw-left-20",
    "before:-tw-left-30",
    "before:-tw-left-40",
    "before:-tw-left-50",
    "before:-tw-left-60",
    "before:-tw-left-70",
    "before:-tw-left-80",
    "before:-tw-left-90",
    "before:tw-bg-main",
    "before:tw-bg-blue-900",
  ],
  theme: {
    extend: {
      animation: {
        coucou: "coucou 2s ease-in-out 0s infinite",
        brrrr: "brrrr 5s ease-in-out 0s infinite",
      },
      keyframes: {
        coucou: {
          "0%, 20%, 40%": { transform: "rotate(-30deg)" },
          "10%, 30%": { transform: "rotate(30deg)" },
          "50%": { transform: "rotate(0deg)" },
        },
        brrrr: {
          "0%, 2%, 4%, 6%, 8%, 10%, 12%, 14%, 16%, 18%": { transform: "rotate(-2deg)" },
          "1%, 3%, 5%, 7%, 9%, 11%, 13%, 15%, 17%, 19%": { transform: "rotate(2deg)" },
          "20%": { transform: "rotate(0deg)" },
        },
      },
      gridTemplateColumns: {
        "new-report-squares": "repeat(auto-fit, minmax(40%, 1fr))",
      },
      colors: {
        main: "#226854", // higher contrast
        main75: "#617e71",
        main50: "#95a9a0",
        main25: "#cad4cf",
        "mano-sombre": "#374B43",
        black: "#1D2021",
        black75: "#3b3b3b",
        black50: "#777777",
        black25: "#b9b9b9",
        black05: "#F7F9FA",
        white: "#FFFFFF",
        redDark: "#F5222D",
        redLight: "#FBE4E4",
        orangeLight: "#FEF3C7",
        orangeDark: "#D97706",
      },
      borderColor: (theme) => ({
        DEFAULT: theme("colors.black"),
        dark: {
          DEFAULT: theme("colors.white"),
        },
      }),
      minHeight: {
        "1/2": "50vh",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms")({
      // strategy: 'base', // only generate global styles
      /* When using the class strategy, form elements are not styled globally,
       and instead must be styled using the generated form-{name} classes. */
      strategy: "class", // only generate classes
    }),
  ],
  prefix: "tw-",
};
