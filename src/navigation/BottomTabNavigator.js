/**
 * BottomTabNavigator
 *
 * Main bottom tab bar: Home, Animals, Production, Purchase, Sales, More.
 * Each tab (except Home) renders its own stack navigator so it can
 * push sub-screens (e.g. Animals -> Add Animal) without extra nesting
 * at the root level.
 *
 * Icons use plain emoji for now to avoid adding an icon library dependency.
 */
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/Dashboard';
import AnimalsNavigator from './AnimalsNavigator';
import ProductionNavigator from './ProductionNavigator';
import PurchaseNavigator from './PurchaseNavigator';
import SalesNavigator from './SalesNavigator';
import MoreNavigator from './MoreNavigator';
import colors from '../constants/colors';
import { TABS } from './routes';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  [TABS.HOME]: '🏠',
  [TABS.ANIMALS]: '🐄',
  [TABS.PRODUCTION]: '🥛',
  [TABS.PURCHASE]: '🚚',
  [TABS.SALES]: '💰',
  [TABS.MORE]: '⋯',
};

// Defined outside the navigator so it isn't re-created on every render.
const TabIcon = ({ routeName, color }) => (
  <Text style={[styles.icon, { color }]}>{TAB_ICONS[routeName]}</Text>
);

const BottomTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: styles.tabBar,
      tabBarLabelStyle: styles.tabLabel,
      tabBarItemStyle: styles.tabItem,
      tabBarActiveBackgroundColor: colors.primaryLight,
      tabBarIcon: ({ color }) => (
        <TabIcon routeName={route.name} color={color} />
      ),
    })}
  >
    <Tab.Screen
      name={TABS.HOME}
      component={DashboardScreen}
      options={{ title: 'Home' }}
    />
    <Tab.Screen
      name={TABS.ANIMALS}
      component={AnimalsNavigator}
      options={{ title: 'Animals' }}
    />
    <Tab.Screen
      name={TABS.PRODUCTION}
      component={ProductionNavigator}
      options={{ title: 'Production' }}
    />
    <Tab.Screen
      name={TABS.PURCHASE}
      component={PurchaseNavigator}
      options={{ title: 'Purchase' }}
    />
    <Tab.Screen
      name={TABS.SALES}
      component={SalesNavigator}
      options={{ title: 'Sales' }}
    />
    <Tab.Screen
      name={TABS.MORE}
      component={MoreNavigator}
      options={{ title: 'More' }}
    />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
  },
  tabItem: {
    borderRadius: 16,
    marginHorizontal: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 3,
  },
  icon: {
    fontSize: 20,
  },
});

export default BottomTabNavigator;
