import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        serif: ["var(--font-serif)", "serif"],
        "display-lg": ["var(--font-serif)", "Playfair Display", "serif"],
        "body-md": ["var(--font-sans)", "sans-serif"],
        "headline-md": ["var(--font-serif)", "Playfair Display", "serif"],
        "headline-sm": ["var(--font-serif)", "Playfair Display", "serif"],
        "display-lg-mobile": ["var(--font-serif)", "Playfair Display", "serif"],
        "body-lg": ["var(--font-sans)", "sans-serif"],
        "label-md": ["var(--font-sans)", "sans-serif"],
        "label-sm": ["var(--font-sans)", "sans-serif"]
      },
      fontSize: {
        "display-lg": ["52px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "headline-md": ["36px", { lineHeight: "1.2", fontWeight: "600" }],
        "headline-sm": ["26px", { lineHeight: "1.3", fontWeight: "600" }],
        "display-lg-mobile": ["36px", { lineHeight: "1.2", fontWeight: "700" }],
        "body-lg": ["20px", { lineHeight: "1.6", fontWeight: "400" }],
        "label-md": ["15px", { lineHeight: "1.3", letterSpacing: "0.03em", fontWeight: "500" }],
        "label-sm": ["13px", { lineHeight: "1.3", fontWeight: "600" }]
      },
      colors: {
        // Original botanical tokens
        soil: "#5d4037",
        moss: "#8da080",
        leaf: "#1b3022",
        petal: "#e85d75",
        sun: "#d4a373",
        sky: "#77a6c6",
        ink: "#1b1c1a",

        // === Stitch Material Design 3 color tokens ===
        primary: "#061b0e",
        "on-primary": "#ffffff",
        "primary-container": "#1b3022",
        "on-primary-container": "#819986",
        "primary-fixed": "#d0e9d4",
        "primary-fixed-dim": "#b4cdb8",
        "on-primary-fixed": "#0b2013",
        "on-primary-fixed-variant": "#364c3c",
        "inverse-primary": "#b4cdb8",

        secondary: "#526347",
        "on-secondary": "#ffffff",
        "secondary-container": "#d5e9c5",
        "on-secondary-container": "#58694d",
        "secondary-fixed": "#d5e9c5",
        "secondary-fixed-dim": "#b9cdaa",
        "on-secondary-fixed": "#101f09",
        "on-secondary-fixed-variant": "#3b4b31",

        tertiary: "#261200",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#422401",
        "on-tertiary-container": "#b7895b",
        "tertiary-fixed": "#ffdcbd",
        "tertiary-fixed-dim": "#f0bd8b",
        "on-tertiary-fixed": "#2c1600",
        "on-tertiary-fixed-variant": "#623f18",

        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",

        surface: "#fbf9f5",
        "surface-dim": "#dbdad6",
        "surface-bright": "#fbf9f5",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f5f3ef",
        "surface-container": "#efeeea",
        "surface-container-high": "#eae8e4",
        "surface-container-highest": "#e4e2de",
        "surface-variant": "#e4e2de",
        "surface-tint": "#4d6453",
        "on-surface": "#1b1c1a",
        "on-surface-variant": "#434843",

        outline: "#737973",
        "outline-variant": "#c3c8c1",

        background: "#fbf9f5",
        "on-background": "#1b1c1a",
        "inverse-surface": "#30312e",
        "inverse-on-surface": "#f2f0ed"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(27, 48, 34, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
