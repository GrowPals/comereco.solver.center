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
        // Sistema de colores base
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",

        // Paleta Pastel - Verde Menta (Primary)
        mint: {
          50: "var(--mint-50)",
          100: "var(--mint-100)",
          200: "var(--mint-200)",
          300: "var(--mint-300)",
          400: "var(--mint-400)",
          500: "var(--mint-500)",
          600: "var(--mint-600)",
          700: "var(--mint-700)",
          800: "var(--mint-800)",
          900: "var(--mint-900)",
          DEFAULT: "var(--mint-500)",
        },

        // Amarillo Mostaza (Warning)
        mustard: {
          50: "var(--mustard-50)",
          100: "var(--mustard-100)",
          200: "var(--mustard-200)",
          300: "var(--mustard-300)",
          400: "var(--mustard-400)",
          500: "var(--mustard-500)",
          600: "var(--mustard-600)",
          700: "var(--mustard-700)",
          800: "var(--mustard-800)",
          900: "var(--mustard-900)",
          DEFAULT: "var(--mustard-500)",
        },

        // Rojo Coral (Error)
        coral: {
          50: "var(--coral-50)",
          100: "var(--coral-100)",
          200: "var(--coral-200)",
          300: "var(--coral-300)",
          400: "var(--coral-400)",
          500: "var(--coral-500)",
          600: "var(--coral-600)",
          700: "var(--coral-700)",
          800: "var(--coral-800)",
          900: "var(--coral-900)",
          DEFAULT: "var(--coral-500)",
        },

        // Azul Cielo (Info)
        sky: {
          50: "var(--sky-50)",
          100: "var(--sky-100)",
          200: "var(--sky-200)",
          300: "var(--sky-300)",
          400: "var(--sky-400)",
          500: "var(--sky-500)",
          600: "var(--sky-600)",
          700: "var(--sky-700)",
          800: "var(--sky-800)",
          900: "var(--sky-900)",
          DEFAULT: "var(--sky-500)",
        },

        // Gris Lavanda (Neutral)
        lavender: {
          50: "var(--lavender-50)",
          100: "var(--lavender-100)",
          200: "var(--lavender-200)",
          300: "var(--lavender-300)",
          400: "var(--lavender-400)",
          500: "var(--lavender-500)",
          600: "var(--lavender-600)",
          700: "var(--lavender-700)",
          800: "var(--lavender-800)",
          900: "var(--lavender-900)",
          DEFAULT: "var(--lavender-500)",
        },

        // Mappings semánticos
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "var(--warning-foreground)",
        },
        error: {
          DEFAULT: "var(--error)",
          foreground: "var(--error-foreground)",
        },
        info: {
          DEFAULT: "var(--info)",
          foreground: "var(--info-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },

      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        'full': 'var(--radius-full)',
        DEFAULT: "var(--radius-xl)",
      },

      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        mono: ["'Fira Code'", "'Courier New'", "monospace"],
      },

      backgroundImage: {
        // Gradientes funcionales para botones y componentes
        'gradient-mint': 'var(--gradient-mint)',
        'gradient-mint-hover': 'var(--gradient-mint-hover)',
        'gradient-mustard': 'var(--gradient-mustard)',
        'gradient-mustard-hover': 'var(--gradient-mustard-hover)',
        'gradient-coral': 'var(--gradient-coral)',
        'gradient-coral-hover': 'var(--gradient-coral-hover)',
        'gradient-sky': 'var(--gradient-sky)',
        'gradient-sky-hover': 'var(--gradient-sky-hover)',
        'gradient-lavender': 'var(--gradient-lavender)',
      },

      keyframes: {
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
      },

      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.15s ease-in",
        "slide-in-up": "slide-in-up 0.2s ease-out",
        "slide-in-down": "slide-in-down 0.2s ease-out",
        "scale-in": "scale-in 0.15s ease-out",
      },

      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
      },

      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'smooth-out': 'cubic-bezier(0, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    // Plugin para clases semánticas de tipografía
    function({ addComponents }) {
      addComponents({
        // Headings
        '.heading-1': {
          '@apply text-4xl md:text-5xl font-bold tracking-tight text-foreground': {},
        },
        '.heading-2': {
          '@apply text-3xl md:text-4xl font-bold tracking-tight text-foreground': {},
        },
        '.heading-3': {
          '@apply text-2xl md:text-3xl font-semibold text-foreground': {},
        },
        '.heading-4': {
          '@apply text-xl md:text-2xl font-semibold text-foreground': {},
        },

        // Body text
        '.body-large': {
          '@apply text-lg text-foreground': {},
        },
        '.body-base': {
          '@apply text-base text-foreground': {},
        },
        '.body-small': {
          '@apply text-sm text-foreground': {},
        },

        // Muted text
        '.text-muted': {
          '@apply text-sm text-muted-foreground': {},
        },
      })
    }
  ],
}
