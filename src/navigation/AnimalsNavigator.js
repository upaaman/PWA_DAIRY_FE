/**
 * AnimalsNavigator
 *
 * Stack for the "Animals" tab: List -> Add / Details.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AnimalListScreen from '../screens/Animals/AnimalListScreen';
import AddAnimalScreen from '../screens/Animals/AddAnimalScreen';
import AnimalDetailsScreen from '../screens/Animals/AnimalDetailsScreen';
import EditAnimalScreen from '../screens/Animals/EditAnimalScreen';
import { stackScreenOptions } from './navigationTheme';
import { ANIMALS_ROUTES } from './routes';

const Stack = createNativeStackNavigator();

const AnimalsNavigator = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen
      name={ANIMALS_ROUTES.LIST}
      component={AnimalListScreen}
      options={{ title: 'Animals' }}
    />
    <Stack.Screen
      name={ANIMALS_ROUTES.ADD}
      component={AddAnimalScreen}
      options={{ title: 'Add Animal' }}
    />
    <Stack.Screen
      name={ANIMALS_ROUTES.DETAILS}
      component={AnimalDetailsScreen}
      options={{ title: 'Animal Details' }}
    />
    <Stack.Screen
      name={ANIMALS_ROUTES.EDIT}
      component={EditAnimalScreen}
      options={{ title: 'Edit Animal' }}
    />
  </Stack.Navigator>
);

export default AnimalsNavigator;
