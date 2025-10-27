import type { Config } from "tailwindcss";
import { designTokens } from "./design-tokens";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: designTokens.colors.light.primary,
          hover: designTokens.colors.light.primaryHover,
          active: designTokens.colors.light.primaryActive,
        },
        secondary: {
          DEFAULT: designTokens.colors.light.secondary,
          hover: designTokens.colors.light.secondaryHover,
          active: designTokens.colors.light.secondaryActive,
        },
        accent: {
          DEFAULT: designTokens.colors.light.accent,
          hover: designTokens.colors.light.accentHover,
          active: designTokens.colors.light.accentActive,
        },
        background: designTokens.colors.light.background,
        surface: designTokens.colors.light.surface,
      },
      fontFamily: {
        sans: [...designTokens.typography.fontFamily.sans],
        mono: [...designTokens.typography.fontFamily.mono],
      },
      fontSize: designTokens.typography.sizes,
      borderRadius: designTokens.borderRadius,
      boxShadow: {
        neumorphic: designTokens.shadows.neumorphicRaised,
        neumorphicPressed: designTokens.shadows.neumorphicPressed,
        neumorphicFlat: designTokens.shadows.neumorphicFlat,
      },
      transitionDuration: {
        DEFAULT: designTokens.transitions.duration.normal,
      },
      spacing: ((): Record<string, string> => {
        const { unit, ...rest } = designTokens.spacing;
        return rest;
      })(),
    },
  },
  plugins: [],
};

export default config;

