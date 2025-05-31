import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: 'rgb(87, 167, 115)',
          hover: 'rgb(75, 145, 100)',
        },
        background: {
          DEFAULT: 'rgb(18, 22, 25)',
          hover: 'rgb(25, 30, 35)',
        },
        accent: {
          DEFAULT: 'rgb(45, 71, 57)',
          hover: 'rgb(55, 85, 70)',
        },
      },
    },
  },
  plugins: [],
}
export default config 