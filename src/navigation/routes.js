/**
 * routes.js
 *
 * Central place for screen/route name constants used across navigators.
 * Using constants instead of raw strings avoids typos when calling
 * navigation.navigate('SomeScreen').
 */

// Bottom tab route names
export const TABS = {
  HOME: 'HomeTab',
  ANIMALS: 'AnimalsTab',
  PRODUCTION: 'ProductionTab',
  PURCHASE: 'PurchaseTab',
  SALES: 'SalesTab',
  MORE: 'MoreTab',
};

// Animals stack
export const ANIMALS_ROUTES = {
  LIST: 'AnimalList',
  ADD: 'AddAnimal',
  DETAILS: 'AnimalDetails',
};

// Production stack
export const PRODUCTION_ROUTES = {
  LIST: 'MilkProductionList',
  ADD: 'AddMilkProduction',
  HISTORY: 'ProductionHistory',
  STATISTICS: 'ProductionStatistics',
  FILTERS: 'ProductionFilters',
};

// Purchase stack
export const PURCHASE_ROUTES = {
  LIST: 'PurchaseList',
  ADD: 'AddPurchase',
};

// Sales stack
export const SALES_ROUTES = {
  LIST: 'MilkSalesList',
  ADD: 'AddSale',
  DETAILS: 'SaleDetails',
};

// More stack
export const MORE_ROUTES = {
  MENU: 'MoreMenu',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  SELLER: 'Seller',
  CUSTOMER: 'Customer',
};
