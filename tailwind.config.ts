import type { Config } from 'tailwindcss';

// this is the Tailwind CSS configuration file for MJ
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pinkBase: '#F8DDE8',
        pinkLight: '#FCEAF2',
        pinkDark: '#E8A8C4',
        pinkHot: '#FF4FA3'
      },
      borderRadius: {
        xl: '1.25rem'
      },
      boxShadow: {
        neuRaised: '0 6px 12px rgba(0,0,0,0.1), 0 -6px 12px rgba(255,255,255,0.8)',
        neuInset: 'inset 0 4px 8px rgba(0,0,0,0.1), inset 0 -4px 8px rgba(255,255,255,0.8)'
      }
    }
  },
  plugins: []
};

export default config;
