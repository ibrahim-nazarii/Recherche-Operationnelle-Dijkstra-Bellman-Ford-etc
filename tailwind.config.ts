import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#020408', // Deepest black/navy
        sidebar: '#0B0D12',     // Slightly lighter for sidebar
        card: '#13161F',        // Card background
        'card-hover': '#1C202E',
        primary: {
          DEFAULT: '#7C3AED',   // The purple accent
          hover: '#6D28D9',
        },
        secondary: '#1E293B',   // Dark blue-grey for pills
        text: {
          main: '#F8FAFC',
          muted: '#94A3B8',
        }
      },
      typography: (theme: any) => ({
        DEFAULT: {
          css: {
            color: theme('colors.text.main'),
            '--tw-prose-body': theme('colors.text.main'),
            '--tw-prose-headings': theme('colors.white'),
            '--tw-prose-links': theme('colors.primary.DEFAULT'),
            '--tw-prose-bold': theme('colors.white'),
            '--tw-prose-counters': theme('colors.text.muted'),
            '--tw-prose-bullets': theme('colors.text.muted'),
            '--tw-prose-hr': theme('colors.white'),
            '--tw-prose-quotes': theme('colors.text.muted'),
            '--tw-prose-quote-borders': theme('colors.primary.DEFAULT'),
            '--tw-prose-captions': theme('colors.text.muted'),
            '--tw-prose-code': theme('colors.primary.DEFAULT'),
            '--tw-prose-pre-code': theme('colors.text.main'),
            '--tw-prose-pre-bg': theme('colors.card'),
            '--tw-prose-th-borders': theme('colors.white'),
            '--tw-prose-td-borders': theme('colors.white'),
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
export default config
