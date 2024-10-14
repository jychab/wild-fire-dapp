const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Helvetica', 'Arial', 'sans-serif'],
        luckiestguy: ['Luckiest Guy'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('daisyui'),
    require('tailwindcss-animated'),
    require('tailwind-scrollbar'),
    require('@tailwindcss/line-clamp'),
  ],
  daisyui: {
    themes: [
      {
        light: {
          primary: '#111011',
          secondary: '#38bdf8',
          accent: '#f43f5e',
          neutral: '#e7e5e4',
          'base-100': '#ffffff',
          info: '#d1d5db',
          success: '#4ade80',
          warning: '#fbbf24',
          error: '#be123c',
        },
      },
      {
        dark: {
          primary: '#e7e5e4',
          secondary: '#38bdf8',
          accent: '#f4ef5e',
          neutral: '#292524',
          'base-100': '#111011',
          'base-300': '#202327',
          info: '#d1d5db',
          success: '#4ade80',
          warning: '#fbbf24',
          error: '#be123c',
        },
      },
    ], // false: only light + dark | true: all themes | array: specific themes like this ["light", "dark", "cupcake"]
    darkTheme: 'dark', // name of one of the included themes for dark mode
    base: true, // applies background color and foreground color for root element by default
    styled: true, // include daisyUI colors and design decisions for all components
    utils: true, // adds responsive and modifier utility classes
    prefix: '', // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
    logs: true, // Shows info about daisyUI version and used config in the console when building your CSS
    themeRoot: ':root', // The element that receives theme color CSS variables
  },
};
