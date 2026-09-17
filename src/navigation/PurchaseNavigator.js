/**
 * PurchaseNavigator
 *
 * Stack for the "Purchase" tab: List -> Add Purchase.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PurchaseListScreen from '../screens/Purchase/PurchaseListScreen';
import AddPurchaseScreen from '../screens/Purchase/AddPurchaseScreen';
import colors from '../constants/colors';
import { PURCHASE_ROUTES } from './routes';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '600' },
};

const PurchaseNavigator = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen
      name={PURCHASE_ROUTES.LIST}
      component={PurchaseListScreen}
      options={{ title: 'Milk Purchase' }}
    />
    <Stack.Screen
      name={PURCHASE_ROUTES.ADD}
      component={AddPurchaseScreen}
      options={{ title: 'Add Purchase' }}
    />
  </Stack.Navigator>
);

export default PurchaseNavigator;
