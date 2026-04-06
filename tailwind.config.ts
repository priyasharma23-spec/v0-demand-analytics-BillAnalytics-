import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a56fe',
          hover: '#1b5af4',
        },
        success: '#22c55e',
        disabled: '#e0e0e0',
        background: {
          light: '#f0f5fa',
          primary: '#ffffff',
          'primary-dark': '#1c1c1a',
          secondary: '#f5f5f4',
          'secondary-dark': '#262624',
          tertiary: '#efefed',
          'tertiary-dark': '#2e2e2c',
          info: '#e6f1fb',
          'info-dark': '#0c447c',
        },
        text: {
          dark: '#192744',
          muted: '#858ea2',
          primary: '#1a1a18',
          'primary-dark': '#f0efe9',
          secondary: '#6b6b67',
          'secondary-dark': '#a8a8a2',
          tertiary: '#9b9b96',
          'tertiary-dark': '#6e6e68',
          info: '#185fa5',
          'info-dark': '#85b7eb',
        },
        border: {
          DEFAULT: '#efeff1',
          tertiary: 'rgba(0,0,0,0.15)',
          secondary: 'rgba(0,0,0,0.30)',
          primary: 'rgba(0,0,0,0.40)',
        },
        semantic: {
          danger: {
            fill: '#FCEBEB',
            border: '#F7C1C1',
            text: '#A32D2D',
            'text-dark': '#791F1F',
          },
          warn: {
            fill: '#FAEEDA',
            border: '#FAC775',
            text: '#854F0B',
            'text-dark': '#633806',
          },
          info: {
            fill: '#E6F1FB',
            border: '#B5D4F4',
            text: '#185FA5',
            'text-dark': '#0C447C',
          },
          good: {
            fill: '#EAF3DE',
            border: '#C0DD97',
            text: '#3B6D11',
            'text-dark': '#27500A',
          },
        },
      },
      borderRadius: {
        md: '8px',
        lg: '12px',
      },
      spacing: {
        vdivider: '0.5px',
      },
    },
  },
  plugins: [],
};

export default config;
