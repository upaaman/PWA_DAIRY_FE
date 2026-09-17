/**
 * MoreNavigator
 *
 * Stack for the "More" tab: Menu -> Profile / Settings.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MoreMenuScreen from '../screens/More/MoreMenuScreen';
import ProfileScreen from '../screens/More/ProfileScreen';
import SettingsScreen from '../screens/More/SettingsScreen';
import SellerScreen from '../screens/More/SellerScreen';
import CustomerScreen from '../screens/More/CustomerScreen';
import colors from '../constants/colors';
import { MORE_ROUTES } from './routes';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '600' },
};

const MoreNavigator = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen
      name={MORE_ROUTES.MENU}
      component={MoreMenuScreen}
      options={{ title: 'More' }}
    />
    <Stack.Screen
      name={MORE_ROUTES.PROFILE}
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
    <Stack.Screen
      name={MORE_ROUTES.SELLER}
      component={SellerScreen}
      options={{ title: 'Sellers' }}
    />
    <Stack.Screen
      name={MORE_ROUTES.CUSTOMER}
      component={CustomerScreen}
      options={{ title: 'Customers' }}
    />
     <Stack.Screen
      name={MORE_ROUTES.SETTINGS}
      component={SettingsScreen}
      options={{ title: 'Settings' }}
    />
  </Stack.Navigator>
);

export default MoreNavigator;
