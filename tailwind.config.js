/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Heebo', 'sans-serif'],
      },
      colors: {
        'red-primary': '#dc2626',
        'red-light': '#fecaca',
        'red-hover': '#b91c1c',
        'red-dark': '#991b1b',
        'gray-hover': '#f3f4f6',
        'gray-light': '#f9fafb',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
  ],
}
