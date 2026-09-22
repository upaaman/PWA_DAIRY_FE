/**
 * SalesNavigator
 *
 * Stack for the "Sales" tab: List -> Add Sale.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MilkSalesListScreen from '../screens/Sales/MilkSalesListScreen';
import AddSaleScreen from '../screens/Sales/AddSaleScreen';
import SaleDetailsScreen from '../screens/Sales/SaleDetailsScreen';
import EditSaleScreen from '../screens/Sales/EditSaleScreen';
import colors from '../constants/colors';
import { SALES_ROUTES } from './routes';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '600' },
};

const SalesNavigator = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen
      name={SALES_ROUTES.LIST}
      component={MilkSalesListScreen}
      options={{ title: 'Milk Sales' }}
    />
    <Stack.Screen
      name={SALES_ROUTES.ADD}
      component={AddSaleScreen}
      options={{ title: 'Add Sale' }}
    />
    <Stack.Screen
      name={SALES_ROUTES.DETAILS}
      component={SaleDetailsScreen}
      options={{ title: 'Sale Details' }}
    />
    <Stack.Screen
      name={SALES_ROUTES.EDIT}
      component={EditSaleScreen}
      options={{ title: 'Edit Sale' }}
    />
  </Stack.Navigator>
);

export default SalesNavigator;
