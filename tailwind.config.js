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
                    black: "#000000",       // Pure OLED black for root background
                    darkgray: "#18181B",    // Elevated cards, modals, and sidebars (Zinc 900)
                    yellow: "#FCD535",      // Primary accent, active tabs, CTA buttons
                    green: "#10B981",       // Positive PnL and success states
                    red: "#EF4444",         // Negative PnL and error states
                    muted: "#A1A1AA",       // Secondary text and labels (Zinc 400)
                    border: "rgba(255, 255, 255, 0.12)", // Stronger borders for visible section block delineation
                    'border-light': "rgba(255, 255, 255, 0.05)", // Ultra-subtle inner borders
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'], // Forces Inter globally
            },
            boxShadow: {
                'glow-yellow': '0 0 20px rgba(252, 213, 53, 0.15)', // Subtle yellow glow for active elements
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.6)', // Deep shadow for glassmorphism dropdowns
            },
            backgroundImage: {
                'glass-gradient': 'linear-gradient(135deg, rgba(24, 24, 27, 0.7) 0%, rgba(0, 0, 0, 0.95) 100%)',
            }
        },
    },
    plugins: [],
}
