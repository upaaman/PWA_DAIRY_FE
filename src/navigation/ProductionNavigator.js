/**
 * ProductionNavigator
 *
 * Stack for the "Production" tab:
 * List -> Add / History / Statistics.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MilkProductionListScreen from '../screens/MilkProduction/MilkProductionListScreen';
import AddMilkProductionScreen from '../screens/MilkProduction/AddMilkProductionScreen';
import MilkProductionDetailScreen from '../screens/MilkProduction/MilkProductionDetailScreen';
import EditMilkProductionScreen from '../screens/MilkProduction/EditMilkProductionScreen';
import ProductionHistoryScreen from '../screens/MilkProduction/ProductionHistoryScreen';
import ProductionStatisticsScreen from '../screens/MilkProduction/ProductionStatisticsScreen';
import ProductionFiltersScreen from '../screens/MilkProduction/ProductionFiltersScreen';
import { stackScreenOptions } from './navigationTheme';
import { PRODUCTION_ROUTES } from './routes';

const Stack = createNativeStackNavigator();

const ProductionNavigator = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen
      name={PRODUCTION_ROUTES.LIST}
      component={MilkProductionListScreen}
      options={{ title: 'Milk Production' }}
    />
    <Stack.Screen
      name={PRODUCTION_ROUTES.ADD}
      component={AddMilkProductionScreen}
      options={{ title: 'Add Production' }}
    />
    <Stack.Screen
      name={PRODUCTION_ROUTES.DETAILS}
      component={MilkProductionDetailScreen}
      options={{ title: 'Production Details' }}
    />
    <Stack.Screen
      name={PRODUCTION_ROUTES.EDIT}
      component={EditMilkProductionScreen}
      options={{ title: 'Edit Production' }}
    />
    <Stack.Screen
      name={PRODUCTION_ROUTES.HISTORY}
      component={ProductionHistoryScreen}
      options={{ title: 'Production History' }}
    />
    <Stack.Screen
      name={PRODUCTION_ROUTES.STATISTICS}
      component={ProductionStatisticsScreen}
      options={{ title: 'Statistics' }}
    />
    <Stack.Screen
      name={PRODUCTION_ROUTES.FILTERS}
      component={ProductionFiltersScreen}
      options={{ title: 'Filters', presentation: 'modal' }}
    />
  </Stack.Navigator>
);

export default ProductionNavigator;
