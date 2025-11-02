const { fontFamily } = require("tailwindcss/defaultTheme")

/** @type {import('tailwindcss').Config} */
module.exports = {
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

        // Primary - ComerECO Green
        primary: {
          50: "var(--primary-50)",
          100: "var(--primary-100)",
          200: "var(--primary-200)",
          300: "var(--primary-300)",
          500: "var(--primary-500)", // BASE
          600: "var(--primary-600)",
          700: "var(--primary-700)",
          800: "var(--primary-800)",
          900: "var(--primary-900)",
          DEFAULT: "var(--primary-500)",
          foreground: "var(--primary-foreground)",
        },

        // Neutral scale
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

        // Secondary
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },

        // Destructive
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },

        // Muted
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },

        // Accent
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },

        // Popover
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },

        // Card
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },

        // Semantic colors - Extended
        success: {
          DEFAULT: '#10b981',
          light: '#d1fae5',
          dark: '#065f46',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fef3c7',
          dark: '#92400e',
          foreground: '#ffffff',
        },
        error: {
          DEFAULT: '#ef4444',
          light: '#fee2e2',
          dark: '#991b1b',
          foreground: '#ffffff',
        },
        info: {
          DEFAULT: '#3b82f6',
          light: '#dbeafe',
          dark: '#1e40af',
          foreground: '#ffffff',
        },

        // Status colors para requisiciones y estados de negocio
        status: {
          draft: '#94a3b8',
          pending: '#f59e0b',
          approved: '#10b981',
          rejected: '#ef4444',
          ordered: '#3b82f6',
          cancelled: '#64748b',
        },
      },

      borderRadius: {
        'sm': 'var(--radius-sm)',     // 8px
        'md': 'var(--radius-md)',     // 12px
        'lg': 'var(--radius-lg)',     // 16px
        'xl': 'var(--radius-xl)',     // 20px
        '2xl': 'var(--radius-2xl)',   // 24px
        'pill': 'var(--radius-pill)', // 32px
        'full': 'var(--radius-full)', // 9999px
        DEFAULT: "var(--radius-lg)",
      },

      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
        mono: ["'Fira Code'", "'Courier New'", "monospace"],
      },

      boxShadow: {
        'xs': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px rgba(0, 0, 0, 0.04)',
        'md': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'lg': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'xl': '0 8px 24px rgba(0, 0, 0, 0.12)',
        '2xl': '0 16px 48px rgba(0, 0, 0, 0.16)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.15)',
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
        // Simplified - removing complex gradients
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
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },

      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Plugin para clases semánticas de tipografía
    function({ addComponents }) {
      addComponents({
        '.heading-1': {
          '@apply text-4xl md:text-5xl font-bold tracking-tight leading-tight text-gray-900': {},
        },
        '.heading-2': {
          '@apply text-3xl md:text-4xl font-bold tracking-tight leading-tight text-gray-900': {},
        },
        '.heading-3': {
          '@apply text-2xl md:text-3xl font-semibold leading-tight text-gray-900': {},
        },
        '.heading-4': {
          '@apply text-xl md:text-2xl font-semibold leading-normal text-gray-900': {},
        },
        '.heading-5': {
          '@apply text-lg md:text-xl font-semibold leading-normal text-gray-900': {},
        },
        '.body-large': {
          '@apply text-lg leading-relaxed text-gray-700': {},
        },
        '.body-base': {
          '@apply text-base leading-normal text-gray-700': {},
        },
        '.body-small': {
          '@apply text-sm leading-normal text-gray-600': {},
        },
        '.caption': {
          '@apply text-xs leading-normal text-gray-500 uppercase tracking-wide': {},
        },
        '.label': {
          '@apply text-sm font-medium leading-none text-gray-700': {},
        },
      })
    }
  ],
}
