/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
  extend: {
    colors: {
      navy: '#050816',
      cyan: '#38BDF8',
      brand: {
        blue: '#2563EB',
        cyan: '#38BDF8',
        navy: '#050816',
      },
    },
  },
},
  plugins: [],
};