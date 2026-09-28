/**
 * colors.js
 *
 * Central color palette for the Dairy Farm Management app.
 * Import these instead of hardcoding hex values in screens/components,
 * so the whole app stays visually consistent and easy to re-theme later.
 */

const colors = {
  // Fresh forest and mint brand palette
  primary: '#23734D', // main brand color (buttons, headers, active states)
  primaryDark: '#19583A', // pressed/hover state for primary
  primaryDeep: '#123D2B', // darkest green - gradients, hero sections
  primaryLight: '#E2F3D9', // very light green - badges, selected chips, subtle backgrounds
  primarySoft: '#F3FAEF', // faintest green wash - screen/scaffold tints
  secondary: '#6CA457', // lighter green - secondary accents, success highlights

  // Green scale (Tailwind-inspired) for flexible accent work
  green50: '#F3FAEF',
  green100: '#E2F3D9',
  green200: '#CCE7BB',
  green300: '#ACD398',
  green400: '#86BA70',
  green500: '#62A054',
  green600: '#3E884D',
  green700: '#23734D',
  green800: '#19583A',
  green900: '#123D2B',

  // Feedback
  success: '#24764D',
  warning: '#A96109',
  danger: '#C53F51',
  info: '#3569B0',

  // Extra accents — used for colorful dashboard-style stat cards where
  // each metric benefits from its own distinct color.
  accentPurple: '#6E8243',
  accentTeal: '#207D79',

  // Surfaces & neutrals
  background: '#F5F8EF', // soft botanical background
  surface: '#FFFFFF', // cards, inputs
  white: '#FFFFFF',
  border: '#DFE8D8', // subtle card/input borders
  borderStrong: '#BDD1B2', // hover/filled borders
  overlay: 'rgba(18, 61, 43, 0.4)', // modal scrim (green-tinted)

  // Text
  text: '#203729', // primary text (near-black, green-tinted)
  textSecondary: '#596D5C', // secondary/supporting text
  textMuted: '#6F806F', // placeholders, disabled text
  textOnPrimary: '#FFFFFF', // text placed on top of primary green

  // Shadow (used with elevation/shadow style helpers)
  shadow: 'rgba(18, 61, 43, 0.10)',
  shadowSubtle: 'rgba(18, 61, 43, 0.06)',
};

export default colors;