import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        mist: "#f4f6fb",
        line: "#e7ebf2",
        accent: "#0ea5e9",
        accentSoft: "#bae6fd"
      },
      boxShadow: {
        glass: "0 20px 60px rgba(15, 23, 42, 0.15)",
        lift: "0 12px 30px rgba(15, 23, 42, 0.12)"
      },
      backdropBlur: {
        glass: "16px"
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      },
      animation: {
        fadeUp: "fadeUp 0.6s ease-out",
        shimmer: "shimmer 1.6s infinite"
      }
    }
  },
  plugins: []
};

export default config;

