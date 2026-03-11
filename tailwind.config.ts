import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        offwhite: "#FAF8F5",
        cream: "#FFFEF9",
        champagne: "#C9A962",
        champagneLight: "#E8DCC8",
        beige: "#F5EDE4",
        warmInk: "#2C2415",
        warmMuted: "#6B5B4F",
        sky: "#8BB4C9",
        sage: "#7A9B76",
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        handwritten: ["var(--font-shippori)", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
