module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--color-surface-raised) / <alpha-value>)",
        foreground: "rgb(var(--color-ink) / <alpha-value>)",
        card: "rgb(var(--color-surface) / <alpha-value>)",
        "card-muted": "rgb(var(--color-surface-muted) / <alpha-value>)",
        muted: "rgb(var(--color-ink-muted) / <alpha-value>)",
        "muted-foreground": "rgb(var(--color-ink-subtle) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--color-brand) / <alpha-value>)",
          strong: "rgb(var(--color-brand-strong) / <alpha-value>)",
          soft: "rgb(var(--color-brand-soft) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          muted: "rgb(var(--color-surface-muted) / <alpha-value>)",
          raised: "rgb(var(--color-surface-raised) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          subtle: "rgb(var(--color-ink-subtle) / <alpha-value>)",
          muted: "rgb(var(--color-ink-muted) / <alpha-value>)",
          faint: "rgb(var(--color-ink-faint) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--color-border) / <alpha-value>)",
          strong: "rgb(var(--color-border-strong) / <alpha-value>)",
        },
        ai: {
          bg: "rgb(var(--color-ai-bg) / <alpha-value>)",
          text: "rgb(var(--color-ai-text) / <alpha-value>)",
          border: "rgb(var(--color-ai-border) / <alpha-value>)",
        },
        success: {
          bg: "rgb(var(--color-success-bg) / <alpha-value>)",
          text: "rgb(var(--color-success-text) / <alpha-value>)",
          border: "rgb(var(--color-success-border) / <alpha-value>)",
        },
        warning: {
          bg: "rgb(var(--color-warning-bg) / <alpha-value>)",
          text: "rgb(var(--color-warning-text) / <alpha-value>)",
          border: "rgb(var(--color-warning-border) / <alpha-value>)",
        },
        danger: {
          bg: "rgb(var(--color-danger-bg) / <alpha-value>)",
          text: "rgb(var(--color-danger-text) / <alpha-value>)",
          border: "rgb(var(--color-danger-border) / <alpha-value>)",
        },
        info: {
          bg: "rgb(var(--color-info-bg) / <alpha-value>)",
          text: "rgb(var(--color-info-text) / <alpha-value>)",
          border: "rgb(var(--color-info-border) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "Segoe UI", "sans-serif"],
        body: ["Space Grotesk", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "var(--shadow-card)",
        soft: "var(--shadow-soft)",
      },
      borderRadius: {
        xl: "18px",
      },
    },
  },
  plugins: [],
};
