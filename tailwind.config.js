/** @type {import('tailwindcss').Config} */
export default {
  content: ['./sites/**/index.html', './packages/base/src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        heading: ['var(--font-heading)'],
      },
      /**
       * Couleurs déclarées via les canaux RVB (`--*-rgb`) et `<alpha-value>` :
       * c'est ce qui rend les modificateurs d'opacité opérants
       * (`bg-primary/10`, `border-primary/30`, `bg-cream/50`…). Avec un simple
       * `var(--color-primary)`, Tailwind ne peut pas injecter l'alpha et
       * n'émet aucune règle pour ces utilitaires.
       */
      colors: {
        primary: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
        'primary-hover': 'rgb(var(--color-primary-hover-rgb) / <alpha-value>)',
        /** Nuances dérivées de `primary` (voir vite/site-from-config.mjs). */
        'primary-soft': 'rgb(var(--color-primary-soft-rgb) / <alpha-value>)',
        'primary-deep': 'rgb(var(--color-primary-deep-rgb) / <alpha-value>)',
        /** Lavis quasi blanc : fonds survolés et puces sur fond clair. */
        'primary-tint': 'rgb(var(--color-primary-tint-rgb) / <alpha-value>)',
        /** Teinte claire désaturée : textes et filets sur fond de marque. */
        'primary-sage': 'rgb(var(--color-primary-sage-rgb) / <alpha-value>)',
        cream: {
          DEFAULT: 'rgb(var(--color-cream-rgb) / <alpha-value>)',
          100: 'rgb(var(--color-cream-100-rgb) / <alpha-value>)',
          200: 'rgb(var(--color-cream-200-rgb) / <alpha-value>)',
          300: 'rgb(var(--color-cream-300-rgb) / <alpha-value>)',
        },
        'text-main': 'rgb(var(--color-text-main-rgb) / <alpha-value>)',
        'text-on-dark': 'rgb(var(--color-text-on-dark-rgb) / <alpha-value>)',
        'text-muted': 'var(--color-text-muted)',
        'border-subtle': 'var(--color-border-subtle)',
        'border-strong': 'var(--color-border-strong)',
      },
      /**
       * L'échelle d'ombres de Tailwind est remplacée par des ombres teintées de
       * la couleur de marque : les centaines de `shadow-lg` existants gagnent la
       * profondeur chaude du thème sans être réécrits un par un.
       */
      boxShadow: {
        sm: 'var(--shadow-xs)',
        DEFAULT: 'var(--shadow-soft)',
        md: 'var(--shadow-soft)',
        lg: 'var(--shadow-card)',
        xl: 'var(--shadow-lift)',
        '2xl': 'var(--shadow-modal)',
        soft: 'var(--shadow-soft)',
        card: 'var(--shadow-card)',
        lift: 'var(--shadow-lift)',
        forest: 'var(--shadow-forest)',
      },
      backgroundImage: {
        forest: 'var(--gradient-forest)',
        cta: 'var(--gradient-cta)',
        sand: 'var(--gradient-sand)',
        card: 'var(--gradient-card)',
      },
      borderRadius: {
        none: '0',
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-default)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        full: 'var(--radius-full)',
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
}
