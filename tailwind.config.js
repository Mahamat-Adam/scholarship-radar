/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm paper rather than white. A pure #FFF page under a full screen of
        // text is glare; a few points of warmth take that off without anybody
        // noticing there is a colour there at all.
        paper: '#FAF8F4',
        shell: '#F4F1EB',
        card: '#FFFFFF',
        raise: '#F7F4EE',
        line: '#E7E1D7',
        edge: '#D3CABA',

        // Chrome. `moss` is for text and icons; `mossdeep` is the only one that
        // goes under white, where it measures 7.6:1. `moss` under white is
        // 5.5:1, which passes, but the deeper one is what the buttons want.
        moss: '#0F766E',
        mossdeep: '#115E59',
        tint: '#E4F0EE',

        // Status. Far apart in hue so the state of a card is readable before any
        // of its words are, and every one measured against all four surfaces they
        // are ever drawn on: the lightest is 4.7:1, which clears AA for body text.
        // Three of them started a shade brighter and were darkened for exactly
        // that reason.
        leaf: '#166534',
        ember: '#9A3412',
        clay: '#B91C1C',
        brass: '#854D0E',

        // Type ramp, checked against `paper` — the lightest surface the
        // secondary text of a card ever sits on, and therefore the hardest.
        ink: '#1C1917',
        muted: '#57534E',
        faint: '#6F6862',
      },
      fontFamily: {
        // The Arabic face is listed after the Latin one in every stack rather
        // than swapped in by a rule. A browser picks per glyph, so Latin text on
        // an Arabic page still sets in Sora or Inter, and an Arabic award name on
        // an English page still gets proper Arabic type.
        display: ['Sora', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        sans: ['Inter', '"IBM Plex Sans Arabic"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        // On a light page, depth has to come from shadow rather than from a
        // lighter surface, and it has to be warm or the whole thing turns grey.
        card: '0 1px 2px rgba(41, 31, 20, 0.04), 0 1px 3px rgba(41, 31, 20, 0.06)',
        lift: '0 2px 4px rgba(41, 31, 20, 0.05), 0 8px 20px rgba(41, 31, 20, 0.08)',
      },
      animation: {
        drift: 'drift 24s ease-in-out infinite',
        rise: 'rise 8s ease-in-out infinite',
        beat: 'beat 2.6s ease-in-out infinite',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(-3%, 2%, 0) scale(1.06)' },
        },
        rise: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-7px)' },
        },
        beat: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
    },
  },
  plugins: [],
}
