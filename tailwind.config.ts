import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FBF4EC",
          100: "#F3E6D8",
          200: "#EAD7C4",
          300: "#E4D0BC",
          400: "#D4B89A",
          500: "#C45C2A",
          600: "#A84C22",
          700: "#7A3A1C",
          800: "#3B2418",
          900: "#1C1410",
          sand: "#F3E6D8",
          surface: "#FBF4EC",
          border: "#E4D0BC",
          ink: "#3B2418",
          terracotta: "#C45C2A",
          espresso: "#1C1410",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Archivo", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
