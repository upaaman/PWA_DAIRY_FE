/**
 * PurchaseNavigator
 *
 * Stack for the "Purchase" tab: List -> Details / Add / Edit Purchase.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PurchaseListScreen from '../screens/Purchase/PurchaseListScreen';
import AddPurchaseScreen from '../screens/Purchase/AddPurchaseScreen';
import PurchaseDetailsScreen from '../screens/Purchase/PurchaseDetailsScreen';
import EditPurchaseScreen from '../screens/Purchase/EditPurchaseScreen';
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
    <Stack.Screen
      name={PURCHASE_ROUTES.DETAILS}
      component={PurchaseDetailsScreen}
      options={{ title: 'Purchase Details' }}
    />
    <Stack.Screen
      name={PURCHASE_ROUTES.EDIT}
      component={EditPurchaseScreen}
      options={{ title: 'Edit Purchase' }}
    />
  </Stack.Navigator>
);

export default PurchaseNavigator;
