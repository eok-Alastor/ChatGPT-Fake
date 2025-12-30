/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 启用基于 class 的暗色模式
  theme: {
    extend: {
      colors: {
        gray: {
          750: '#2d3748',
        }
      }
    },
  },
  plugins: [],
}
