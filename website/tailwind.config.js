const colors = require("tailwindcss/colors");

module.exports = {
  content: ["./pages/**/*.js", "./components/**/*.js"],
  theme: {
    extend: {
      colors: {
        black: "#0C1024",
        shamrock: {
          50: "#EBF8F8",
          100: "#D0F7F2",
          200: "#A0F2E2",
          300: "#61E8CF",
          400: "#49C3A6",
          500: "#09C18F",
          600: "#08A672",
          700: "#0E885F",
          800: "#116A4E",
          900: "#115641",
        },
      },
      container: {
        center: true,
        screens: {
          xl: "1142px",
        },
      },
      fontFamily: {
        poppins: ["Poppins"],
      },
      height: {
        18: "4.5rem",
        160: "40rem",
        184: "46rem",
      },
      padding: {
        6.19: "56.25%",
      },
      width: {
        "35/100": "35%",
        92: "23rem",
      },
    },
  },
};
