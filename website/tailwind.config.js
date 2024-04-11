const colors = require("tailwindcss/colors");

module.exports = {
  content: ["./pages/**/*.js", "./components/**/*.js"],
  theme: {
    extend: {
      colors: {
        mano: "#226854",
        black: "#0C1024",
      },
      fontFamily: {
        poppins: ["Poppins"],
      },
    },
  },
};
