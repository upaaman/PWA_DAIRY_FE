import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import BottomTabNavigator from './BottomTabNavigator';
import colors from '../constants/colors';
import { linking } from '../../web/linking';
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};
export default function RootNavigator() {
  return (
    <NavigationContainer linking={linking} theme={theme}>
      <BottomTabNavigator />
    </NavigationContainer>
  );
}
