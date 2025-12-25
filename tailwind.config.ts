import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        'bounce-in': {
          '0%': { transform: 'translate(-50%, -100%) scale(0.5)', opacity: '0' },
          '50%': { transform: 'translate(-50%, 20px) scale(1.1)', opacity: '1' },
          '100%': { transform: 'translate(-50%, 0) scale(1)', opacity: '1' },
        }
      },
      animation: {
        'bounce-in': 'bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
    },
  },
  plugins: [],
};
export default config;
