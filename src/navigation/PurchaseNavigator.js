/**
 * PurchaseNavigator
 *
 * Stack for the "Purchase" tab: List -> Add Purchase.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PurchaseListScreen from '../screens/Purchase/PurchaseListScreen';
import AddPurchaseScreen from '../screens/Purchase/AddPurchaseScreen';
import { stackScreenOptions } from './navigationTheme';
import { PURCHASE_ROUTES } from './routes';

const Stack = createNativeStackNavigator();

const PurchaseNavigator = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
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
