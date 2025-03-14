/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    fontFamily: {
      blaka: ['Blaka', 'serif'],
      lato: ['lato', 'sans-serif'],
      fast: ['Faster One', 'system-ui'],
      afacad: ['Afacad', 'sans-serif']
    },
    extend: {
      backgroundImage: {
        skislope: "url('/src/assets/skiLiftStock.jpg')",
        mountain: "url('/src/assets/mountainStock.png')", // https://pixabay.com/vectors/everest-czomolungma-himalayas-4828404/
      },
      fontFeatureSettings: {
        'afacad': '"auto"',
      },
    },
  },
  plugins: [
    function({ addBase, theme }) {
      addBase({
        'html': {
          fontFeatureSettings: theme('fontFeatureSettings.afacad')
        },
        '.font-afacad': {
          fontOpticalSizing: 'auto',
        }
      })
    }
  ],
}