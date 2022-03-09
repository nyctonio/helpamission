module.exports = {
  content: [
    './pages/**/*.{html,js,ejs}',
    './components/**/*.{html,js,ejs}',
    './views/**/*.{html,js,ejs}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/forms'),],
}