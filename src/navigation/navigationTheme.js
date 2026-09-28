/**
 * navigationTheme.js
 *
 * Shared screen options used by every stack navigator in the app so the
 * headers (and screen backgrounds) look consistent everywhere.
 * Tweaking this file re-themes every header at once.
 */
import colors from '../constants/colors';

// Kept as a plain object (not a function) so it can be spread into each
// Navigator's `screenOptions`.
export const stackScreenOptions = {
  headerStyle: {
    backgroundColor: colors.background,
    shadowColor: colors.green300,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },
  headerShadowVisible: false,
  headerTintColor: colors.primaryDark,
  headerTitleStyle: {
    fontWeight: '800',
    fontSize: 22,
    color: colors.primaryDark,
  },
  headerTitleAlign: 'left',
  contentStyle: { backgroundColor: colors.background },
};

export default stackScreenOptions;