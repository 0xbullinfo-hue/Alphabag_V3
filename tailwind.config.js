/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                alphabag: {
                    // ─── Backgrounds ───────────────────────────────────────────────
                    black:      "#000000",         // Pure OLED black — root background
                    dark:       "#0A0A0A",          // Elevated panels, sidebars, modals
                    darkgray:   "#111113",          // Card surfaces
                    'dark-card':"#141417",          // Inner card elements

                    // ─── Borders & Dividers ─────────────────────────────────────────
                    gray:       "rgba(255,255,255,0.10)",  // Standard border
                    border:     "rgba(255,255,255,0.12)",  // Slightly stronger borders
                    'border-light': "rgba(255,255,255,0.05)", // Ultra-subtle

                    // ─── Primary Accent ─────────────────────────────────────────────
                    yellow:     "#FCD535",          // CTA buttons, active state
                    yellowHover:"#E6BF1A",          // Yellow on hover

                    // ─── Semantic Colours ────────────────────────────────────────────
                    green:      "#10B981",          // Positive / success
                    red:        "#EF4444",          // Negative / error
                    blue:       "#60A5FA",          // Info / link accent

                    // ─── Text Hierarchy ──────────────────────────────────────────────
                    text:       "#F4F4F5",          // Primary body text (Zinc 100)
                    subtext:    "#A1A1AA",          // Secondary labels (Zinc 400)
                    muted:      "#71717A",          // Tertiary / placeholder (Zinc 500)
                    'ultra-muted': "#3F3F46",       // Disabled / decorative (Zinc 700)
                }
            },
            fontFamily: {
                sans: ['Inter', 'Satoshi', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
            },
            fontWeight: {
                thin: '400',
                extralight: '400',
                light: '400',
                normal: '400',
                medium: '400',
                semibold: '800',
                bold: '800',
                extrabold: '800',
                black: '800',
            },
            borderRadius: {
                xl: '1rem',
                '2xl': '1rem',
                '3xl': '1rem',
                '4xl': '1.25rem',
            },
            boxShadow: {
                'glow-yellow': '0 0 20px rgba(252,213,53,0.15)',
                'glow-yellow-lg': '0 0 40px rgba(252,213,53,0.25)',
                'glow-green':  '0 0 20px rgba(16,185,129,0.15)',
                'glass':       '0 8px 32px 0 rgba(0,0,0,0.6)',
                'panel':       '0 4px 24px rgba(0,0,0,0.4)',
            },
            backgroundImage: {
                'glass-gradient': 'linear-gradient(135deg, rgba(20,20,23,0.8) 0%, rgba(0,0,0,0.95) 100%)',
                'yellow-gradient': 'linear-gradient(135deg, #FCD535 0%, #E6BF1A 100%)',
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
                'glow-pulse': 'glowPulse 2s ease-in-out infinite',
                'slide-in': 'slideIn 0.3s ease-out',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                glowPulse: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(252,213,53,0.15)' },
                    '50%':      { boxShadow: '0 0 40px rgba(252,213,53,0.35)' },
                },
                slideIn: {
                    '0%': { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
}
