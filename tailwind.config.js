/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#070F1A",
          900: "#0B1B2B",
          800: "#122A40",
          700: "#1B3A54",
          600: "#264D6B",
        },
        gold: {
          400: "#E8C766",
          500: "#D4AF37",
          600: "#B4922A",
        },
        parchment: {
          100: "#F3EFE3",
          200: "#E4DCC6",
        },
        mist: {
          400: "#8FA3B8",
          500: "#6D8299",
        },
        emerald: {
          500: "#2F9E6E",
          100: "#12332A",
        },
        rust: {
          600: "#A8623A",
          500: "#C97B4A",
          100: "#332015",
        },
      },
      fontFamily: {
        display: ["var(--font-amiri)", "serif"],
        body: ["var(--font-tajawal)", "sans-serif"],
      },
      backgroundImage: {
        "geo-pattern":
          "radial-gradient(circle at 1px 1px, rgba(212,175,55,0.08) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};
