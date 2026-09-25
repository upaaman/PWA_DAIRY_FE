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
import EmployeeScreen from '../screens/Employees/EmployeeScreen';
import AddEmployeeScreen from '../screens/Employees/AddEmployeeScreen';
import AddSalaryScreen from '../screens/Employees/AddSalaryScreen';
import AddSalaryTransactionScreen from '../screens/Employees/AddSalaryTransactionScreen';
import ExpenseListScreen from '../screens/Expenses/ExpenseListScreen';
import AddExpenseScreen from '../screens/Expenses/AddExpenseScreen';
import { stackScreenOptions } from './navigationTheme';
import {
  MORE_ROUTES,
  SELLER_ROUTES,
  CUSTOMER_ROUTES,
  EMPLOYEE_ROUTES,
  EXPENSE_ROUTES,
} from './routes';

const Stack = createNativeStackNavigator();

const MoreNavigator = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
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
    <Stack.Screen
      name={EMPLOYEE_ROUTES.SCREEN}
      component={EmployeeScreen}
      options={{ title: 'Employees' }}
    />
    <Stack.Screen
      name={EMPLOYEE_ROUTES.ADD_EMPLOYEE}
      component={AddEmployeeScreen}
      options={{ title: 'Add Employee' }}
    />
    <Stack.Screen
      name={EMPLOYEE_ROUTES.ADD_SALARY}
      component={AddSalaryScreen}
      options={{ title: 'Add Salary' }}
    />
    <Stack.Screen
      name={EMPLOYEE_ROUTES.ADD_SALARY_TRANSACTION}
      component={AddSalaryTransactionScreen}
      options={{ title: 'Add Salary Transaction' }}
    />
    <Stack.Screen
      name={EXPENSE_ROUTES.LIST}
      component={ExpenseListScreen}
      options={{ title: 'Expenses' }}
    />
    <Stack.Screen
      name={EXPENSE_ROUTES.ADD}
      component={AddExpenseScreen}
      options={{ title: 'Add Expense' }}
    />
  </Stack.Navigator>
);

export default MoreNavigator;
