/**
 * RootNavigator
 *
 * Top-level navigator wrapped in NavigationContainer.
 * Mount this once at the app root (see App.tsx).
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabNavigator from './BottomTabNavigator';

const RootNavigator = () => (
  <NavigationContainer>
    <BottomTabNavigator />
  </NavigationContainer>
);

export default RootNavigator;
