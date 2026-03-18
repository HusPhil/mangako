/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FFFFFF", // White
        secondary: "#212121", // Black
        muted: "#B0B0B0", // Light Gray
        accent: "#7D7D7D", // Medium Gray
        dark: "#4D4D4D", // Dark Gray

        background: "#161618",
      },
    },
  },
  plugins: [],
};
