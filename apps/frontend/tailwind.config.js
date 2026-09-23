/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  // `dark:` follows the app theme (html[data-theme], see ThemeContext), not the
  // OS - except inside a data-theme="light" wrapper (ThemeScope), which pins
  // its subtree to light, e.g. public profiles for logged-out visitors.
  darkMode: ["variant", '&:is([data-theme="dark"] *):not(:is([data-theme="light"] *))'],
  theme: {
    extend: {
      colors:{
        'btn-blue' : '#2196F3',
        'grey' : '#F0F3F5'
      },
      fontFamily: {
        'pop': ['poppins', 'poppins'],
        'head' : ['Epilogue', 'epilogue']
      },
    },
  },
  // Was registered as the string 'typography', so the plugin never loaded.
  plugins: [typography],
};

export default config;