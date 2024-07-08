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
    extend: {},
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          primary: '#fb7185',
          'primary-content': '#f3f4f6',
          secondary: '#9ca3af',
          'secondary-content': '#f3f4f6',
          accent: '#f43f5e',
          'accent-content': '#f3f4f6',
          neutral: '#ffffff',
          'neutral-content': '#f3f4f6',
          'base-100': '#ffffff',
          'base-200': '#e5e7eb',
          'base-300': '#e5e7eb',
          'base-content': '#161616',
          info: '#d1d5db',
          'info-content': '#161616',
        },
      },
      {
        dark: {
          primary: '#ffffff',
          secondary: '#ffffff',
          accent: '#FE5757',
          neutral: '#d1d5db',
          'base-100': '#202020',
          info: '#67e8f9',
          success: '#4ade80',
          warning: '#f59e0b',
          error: '#ffff00',
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
