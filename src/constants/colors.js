/**
 * colors.js
 *
 * Central color palette for the Dairy Farm Management app.
 * Import these instead of hardcoding hex values in screens/components,
 * so the whole app stays visually consistent and easy to re-theme later.
 */

const colors = {
  // Brand
  primary: '#1F6D3E', // dark green - main brand color (buttons, headers, active states)
  primaryDark: '#164F2D', // pressed/hover state for primary
  primaryLight: '#E7F5EC', // very light green - badges, selected chips, subtle backgrounds
  secondary: '#4CAF50', // lighter green - secondary accents, success highlights

  // Feedback
  success: '#2E7D32',
  warning: '#F59E0B',
  danger: '#DC2626',
  info: '#3B82F6',

  // Extra accents — used for colorful dashboard-style stat cards where
  // each metric benefits from its own distinct color.
  accentPurple: '#8B5CF6',
  accentTeal: '#0D9488',

  // Neutrals
  background: '#F7F9F8', // app background (light, slightly off-white)
  white: '#FFFFFF',
  border: '#E5E7EB', // subtle card/input borders
  overlay: 'rgba(0, 0, 0, 0.4)',

  // Text
  text: '#111827', // primary text (near-black)
  textSecondary: '#6B7280', // secondary/supporting text
  textMuted: '#9CA3AF', // placeholders, disabled text
  textOnPrimary: '#FFFFFF', // text placed on top of primary green

  // Shadow (used with elevation/shadow style helpers)
  shadow: 'rgba(16, 24, 40, 0.08)',
};

export default colors;
