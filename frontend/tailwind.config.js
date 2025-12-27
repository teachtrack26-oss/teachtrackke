/** @type {import('tailwindcss').Config} */
module.exports = {
  // darkMode: "class", // Disabled to restore original theme
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6", // Electric Blue
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        accent: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4", // Cyan 500
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
        success: "#22c55e", // Green 500
        warning: "#f59e42", // Amber 500
        danger: "#ef4444", // Red 500
        background: "#f8fafc", // Slate 50
        surface: "#ffffff",
        foreground: "#0f172a", // Slate 900
        muted: "#64748b", // Slate 500
        border: "#e2e8f0", // Slate 200
      },
      boxShadow: {
        xl: "0 8px 32px 0 rgba(31, 41, 55, 0.12)",
        "2xl": "0 16px 48px 0 rgba(31, 41, 55, 0.16)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
    borderColor: (theme) => ({
      ...theme("colors"),
      border: theme("colors.border"),
    }),
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
