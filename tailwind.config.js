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

        // Semantic colors
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        info: "var(--info)",
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
        'card': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'floating': '0 8px 16px rgba(0, 0, 0, 0.08)',
        'button': '0 4px 12px rgba(0, 192, 93, 0.3)',
        'button-hover': '0 6px 16px rgba(0, 192, 93, 0.4)',
        'top': '0 -4px 12px rgba(0, 0, 0, 0.04)',
        'glow-primary': 'var(--glow-primary)',
        'glow-success': 'var(--glow-success)',
        'glow-warning': 'var(--glow-warning)',
        'glow-error': 'var(--glow-error)',
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
        'gradient-primary-intense': 'var(--gradient-primary-intense)',
        'gradient-dark': 'var(--gradient-dark)',
        'gradient-surface': 'var(--gradient-surface)',
        'gradient-success': 'var(--gradient-success)',
        'gradient-warning': 'var(--gradient-warning)',
        'gradient-error': 'var(--gradient-error)',
        'gradient-info': 'var(--gradient-info)',
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
        "pulse-glow": {
          '0%, 100%': {
            boxShadow: '0 4px 16px rgba(0, 192, 93, 0.4)',
          },
          '50%': {
            boxShadow: 'var(--glow-primary)',
          },
        },
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "slide-up": {
          from: { transform: 'translateY(20px)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
      },

      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
