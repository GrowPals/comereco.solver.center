import defaultTheme from "tailwindcss/defaultTheme";
import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Tailwind base colors
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",

        // Primary - Azul Cielo Pastel
        primary: {
          50: "var(--primary-50)",
          100: "var(--primary-100)",
          200: "var(--primary-200)",
          300: "var(--primary-300)",
          400: "var(--primary-400)",
          500: "var(--primary-500)",
          600: "var(--primary-600)",
          700: "var(--primary-700)",
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },

        // Neutral - Gris Lavanda
        neutral: {
          50: "var(--neutral-50)",
          100: "var(--neutral-100)",
          200: "var(--neutral-200)",
          300: "var(--neutral-300)",
          400: "var(--neutral-400)",
          500: "var(--neutral-500)",
          600: "var(--neutral-600)",
          700: "var(--neutral-700)",
          800: "var(--neutral-800)",
          900: "var(--neutral-900)",
        },

        // Muted
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },

        // Card
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },

        // Semantic colors - Paleta Pastel
        success: {
          50: "var(--success-50)",
          100: "var(--success-100)",
          200: "var(--success-200)",
          300: "var(--success-300)",
          400: "var(--success-400)",
          500: "var(--success-500)",
          600: "var(--success-600)",
          700: "var(--success-700)",
          DEFAULT: "var(--success)",
        },
        warning: {
          50: "var(--warning-50)",
          100: "var(--warning-100)",
          200: "var(--warning-200)",
          300: "var(--warning-300)",
          400: "var(--warning-400)",
          500: "var(--warning-500)",
          600: "var(--warning-600)",
          700: "var(--warning-700)",
          DEFAULT: "var(--warning)",
        },
        error: {
          50: "var(--error-50)",
          100: "var(--error-100)",
          200: "var(--error-200)",
          300: "var(--error-300)",
          400: "var(--error-400)",
          500: "var(--error-500)",
          600: "var(--error-600)",
          700: "var(--error-700)",
          DEFAULT: "var(--error)",
        },
        info: {
          50: "var(--info-50)",
          100: "var(--info-100)",
          200: "var(--info-200)",
          300: "var(--info-300)",
          400: "var(--info-400)",
          500: "var(--info-500)",
          600: "var(--info-600)",
          700: "var(--info-700)",
          DEFAULT: "var(--info)",
        },

        // Status colors para requisiciones (usando paleta pastel)
        status: {
          draft: "var(--neutral-400)",
          pending: "var(--warning-500)",
          approved: "var(--success-500)",
          rejected: "var(--error-500)",
          ordered: "var(--info-500)",
          cancelled: "var(--neutral-500)",
        },
      },

      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        'full': 'var(--radius-full)',
        DEFAULT: "var(--radius)",
      },

      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        mono: ["'Fira Code'", "'Courier New'", "monospace"],
      },

      boxShadow: {
        // NO SHADOWS - Sistema minimalista basado en color
        'none': 'none',
        DEFAULT: 'none',
      },

      spacing: {
        '0.5': 'var(--space-0_5)',  // 2px
        '1': 'var(--space-1)',      // 4px
        '2': 'var(--space-2)',      // 8px
        '3': 'var(--space-3)',      // 12px
        '4': 'var(--space-4)',      // 16px
        '5': 'var(--space-5)',      // 20px
        '6': 'var(--space-6)',      // 24px
        '8': 'var(--space-8)',      // 32px
        '10': 'var(--space-10)',    // 40px
        '12': 'var(--space-12)',    // 48px
        '16': 'var(--space-16)',    // 64px
        '20': 'var(--space-20)',    // 80px
      },

      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-success': 'var(--gradient-success)',
        'gradient-warning': 'var(--gradient-warning)',
        'gradient-error': 'var(--gradient-error)',
        'gradient-info': 'var(--gradient-info)',
        'gradient-surface': 'var(--gradient-surface)',
        'gradient-card': 'var(--gradient-card)',
      },

      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "slide-in-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-down": {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        // Animación de corazón favorito - bounce suave
        "heart-bounce": {
          "0%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.25)" },
          "50%": { transform: "scale(0.9)" },
          "75%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        // Animación de pulso sutil para favorito activo
        "heart-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        // Animación de check para botón agregar
        "check-bounce": {
          "0%": { transform: "scale(0) rotate(-45deg)", opacity: "0" },
          "50%": { transform: "scale(1.2) rotate(-45deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shimmer": "shimmer 2s infinite",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.15s ease-in",
        "slide-in-up": "slide-in-up 0.2s ease-out",
        "slide-in-down": "slide-in-down 0.2s ease-out",
        "scale-in": "scale-in 0.15s ease-out",
        "heart-bounce": "heart-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "heart-pulse": "heart-pulse 1.5s ease-in-out infinite",
        "check-bounce": "check-bounce 0.5s ease-out",
      },

      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
      },

      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'smooth-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'smooth-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    // Plugin para clases semánticas de tipografía - Sistema unificado
    function({ addComponents }) {
      addComponents({
        // ============ HEADINGS ============
        // H1 - Hero titles, main page headings
        '.heading-1': {
          '@apply text-4xl md:text-5xl font-bold tracking-tight leading-tight text-foreground': {},
        },
        // H2 - Section titles, major divisions
        '.heading-2': {
          '@apply text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground': {},
        },
        // H3 - Subsection titles, card titles
        '.heading-3': {
          '@apply text-2xl md:text-3xl font-semibold leading-tight text-foreground': {},
        },
        // H4 - Component titles, smaller headers
        '.heading-4': {
          '@apply text-xl md:text-2xl font-semibold leading-normal text-foreground': {},
        },
        // H5 - Minor headings, list headers
        '.heading-5': {
          '@apply text-lg md:text-xl font-semibold leading-normal text-foreground': {},
        },

        // ============ BODY TEXT ============
        // Body Large - Introductory text, emphasis paragraphs
        '.body-large': {
          '@apply text-lg leading-relaxed text-foreground': {},
        },
        // Body Base - Standard body text, default reading
        '.body-base': {
          '@apply text-base leading-normal text-foreground': {},
        },
        // Body Small - Compact text, secondary information
        '.body-small': {
          '@apply text-sm leading-normal text-foreground': {},
        },

        // ============ SECONDARY TEXT ============
        // Secondary Large - Large auxiliary text with improved contrast
        '.text-secondary-lg': {
          '@apply text-lg leading-relaxed text-neutral-700 dark:text-neutral-200': {},
        },
        // Secondary Base - Standard auxiliary text with improved contrast
        '.text-secondary': {
          '@apply text-base leading-normal text-neutral-700 dark:text-neutral-200': {},
        },
        // Secondary Small - Small auxiliary text with improved contrast
        '.text-secondary-sm': {
          '@apply text-sm leading-normal text-neutral-700 dark:text-neutral-200': {},
        },

        // ============ MUTED/TERTIARY TEXT ============
        // Muted text for less important information
        '.text-muted': {
          '@apply text-sm leading-normal text-neutral-600 dark:text-neutral-300': {},
        },
        // Muted extra small
        '.text-muted-xs': {
          '@apply text-xs leading-normal text-neutral-600 dark:text-neutral-300': {},
        },

        // ============ LABELS & METADATA ============
        // Caption - Uppercase labels, tags, badges
        '.caption': {
          '@apply text-xs leading-normal uppercase tracking-wide font-semibold text-neutral-600 dark:text-neutral-300': {},
        },
        // Label - Form labels, input labels
        '.label': {
          '@apply text-sm font-medium leading-none text-foreground': {},
        },
        // Small text - Fine print, helper text
        '.text-small': {
          '@apply text-xs leading-normal text-neutral-600 dark:text-neutral-300': {},
        },

        // ============ NUMERIC/DISPLAY TEXT ============
        // Large numbers for stats, metrics
        '.display-number': {
          '@apply text-3xl md:text-4xl font-bold tabular-nums tracking-tight text-foreground': {},
        },
        // Price display
        '.price-large': {
          '@apply text-2xl font-bold tabular-nums text-foreground': {},
        },
        '.price-medium': {
          '@apply text-xl font-bold tabular-nums text-foreground': {},
        },

        // ============ INTERACTIVE TEXT ============
        // Link style
        '.text-link': {
          '@apply text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline-offset-2 hover:underline transition-colors': {},
        },
      })
    }
  ],
}
