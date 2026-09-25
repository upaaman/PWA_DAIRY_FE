/**
 * colors.js
 *
 * Central color palette for the Dairy Farm Management app.
 * Import these instead of hardcoding hex values in screens/components,
 * so the whole app stays visually consistent and easy to re-theme later.
 */

const colors = {
  // Brand greens — the app's theme is green
  primary: '#1F6D3E', // main brand green (buttons, headers, active states)
  primaryDark: '#164F2D', // pressed/hover state for primary
  primaryDeep: '#0F3D22', // darkest green - gradients, hero sections
  primaryLight: '#E7F5EC', // very light green - badges, selected chips, subtle backgrounds
  primarySoft: '#F2FAF5', // faintest green wash - screen/scaffold tints
  secondary: '#4CAF50', // lighter green - secondary accents, success highlights

  // Green scale (Tailwind-inspired) for flexible accent work
  green50: '#F2FAF5',
  green100: '#E0F3E7',
  green200: '#C4E8D3',
  green300: '#93D6AE',
  green400: '#5CBC80',
  green500: '#37A25F',
  green600: '#268949',
  green700: '#1F6D3E',
  green800: '#17502F',
  green900: '#113D24',

  // Feedback
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
  info: '#3B82F6',

  // Extra accents — used for colorful dashboard-style stat cards where
  // each metric benefits from its own distinct color.
  accentPurple: '#8B5CF6',
  accentTeal: '#0D9488',

  // Surfaces & neutrals
  background: '#F5F9F6', // app background (light, slightly green-tinted)
  surface: '#FFFFFF', // cards, inputs
  white: '#FFFFFF',
  border: '#E2EDE6', // subtle card/input borders
  borderStrong: '#C9DFD2', // hover/filled borders
  overlay: 'rgba(15, 61, 34, 0.4)', // modal scrim (green-tinted)

  // Text
  text: '#101B14', // primary text (near-black, green-tinted)
  textSecondary: '#5B6E63', // secondary/supporting text
  textMuted: '#9DB0A5', // placeholders, disabled text
  textOnPrimary: '#FFFFFF', // text placed on top of primary green

  // Shadow (used with elevation/shadow style helpers)
  shadow: 'rgba(15, 61, 34, 0.10)',
  shadowSubtle: 'rgba(15, 61, 34, 0.06)',
};

export default colors;