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
import AddSellerScreen from '../screens/Sellers/AddSellerScreen';
import AddCustomerScreen from '../screens/Customers/AddCustomerScreen';
import SellerListScreen from '../screens/Sellers/SellerListScreen';
import SellerDetailsScreen from '../screens/Sellers/SellerDetailsScreen';
import EditSellerScreen from '../screens/Sellers/EditSellerScreen';
import CustomerListScreen from '../screens/Customers/CustomerListScreen';
import CustomerDetailsScreen from '../screens/Customers/CustomerDetailsScreen';
import EditCustomerScreen from '../screens/Customers/EditCustomerScreen';
import colors from '../constants/colors';
import { MORE_ROUTES, SELLER_ROUTES, CUSTOMER_ROUTES } from './routes';

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
      name={SELLER_ROUTES.LIST}
      component={SellerListScreen}
      options={{ title: 'Sellers' }}
    />
    <Stack.Screen
      name={SELLER_ROUTES.DETAILS}
      component={SellerDetailsScreen}
      options={{ title: 'Seller Details' }}
    />
    <Stack.Screen
      name={SELLER_ROUTES.EDIT}
      component={EditSellerScreen}
      options={{ title: 'Edit Seller' }}
    />
    <Stack.Screen
      name={SELLER_ROUTES.ADD}
      component={AddSellerScreen}
      options={{ title: 'Add Seller' }}
    />
    <Stack.Screen
      name={SELLER_ROUTES.BILLING}
      component={SellerScreen}
      options={{ title: 'Seller Billing' }}
    />
    <Stack.Screen
      name={CUSTOMER_ROUTES.LIST}
      component={CustomerListScreen}
      options={{ title: 'Customers' }}
    />
    <Stack.Screen
      name={CUSTOMER_ROUTES.DETAILS}
      component={CustomerDetailsScreen}
      options={{ title: 'Customer Details' }}
    />
    <Stack.Screen
      name={CUSTOMER_ROUTES.EDIT}
      component={EditCustomerScreen}
      options={{ title: 'Edit Customer' }}
    />
    <Stack.Screen
      name={CUSTOMER_ROUTES.ADD}
      component={AddCustomerScreen}
      options={{ title: 'Add Customer' }}
    />
    <Stack.Screen
      name={CUSTOMER_ROUTES.BILLING}
      component={CustomerScreen}
      options={{ title: 'Customer Billing' }}
    />
    <Stack.Screen
      name={MORE_ROUTES.SETTINGS}
      component={SettingsScreen}
      options={{ title: 'Settings' }}
    />
  </Stack.Navigator>
);

export default MoreNavigator;
