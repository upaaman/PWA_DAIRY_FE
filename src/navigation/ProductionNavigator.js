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
import ProductionHistoryScreen from '../screens/MilkProduction/ProductionHistoryScreen';
import ProductionStatisticsScreen from '../screens/MilkProduction/ProductionStatisticsScreen';
import ProductionFiltersScreen from '../screens/MilkProduction/ProductionFiltersScreen';
import colors from '../constants/colors';
import { PRODUCTION_ROUTES } from './routes';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '600' },
};

const ProductionNavigator = () => (
  <Stack.Navigator screenOptions={screenOptions}>
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
