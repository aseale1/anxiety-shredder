/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    fontFamily:{
      blaka: ['Blaka', 'serif'],
      lato: ['lato', 'sans-serif']
    },
    backgroundImage: {
      skislope: "url('/src/assets/skiLiftStock.jpg')",

    },

  },
}


