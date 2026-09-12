/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        darkBg: '#050816',
        navyCard: '#0F172A',
        brandCyan: '#38BDF8',
        brandBlue: '#2563EB',
      },
    },
  },
  plugins: [],
};
