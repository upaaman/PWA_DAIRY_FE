import {
  getStateFromPath as parsePath,
  getPathFromState as serializeState,
} from '@react-navigation/native';
import {
  TABS,
  ANIMALS_ROUTES as A,
  PRODUCTION_ROUTES as P,
  PURCHASE_ROUTES as B,
  SALES_ROUTES as S,
  MORE_ROUTES as M,
  SELLER_ROUTES as V,
  CUSTOMER_ROUTES as C,
  EMPLOYEE_ROUTES as E,
  EXPENSE_ROUTES as X,
  BREEDING_ROUTES as R,
  VACCINE_ROUTES as I,
} from '../src/navigation/routes';
export const linking = {
  prefixes: [],
  config: {
    screens: {
      WebNotFound: '*',
      [TABS.HOME]: '',
      [TABS.PRODUCTION]: {
        initialRouteName: P.LIST,
        screens: {
          [P.LIST]: 'production',
          [P.ADD]: 'production/new',
          [P.HISTORY]: 'production/history',
          [P.STATISTICS]: 'production/statistics',
          [P.FILTERS]: 'production/filters',
          [P.DETAILS]: 'production/detail',
          [P.EDIT]: 'production/edit',
        },
      },
      [TABS.PURCHASE]: {
        initialRouteName: B.LIST,
        screens: {
          [B.LIST]: 'purchases',
          [B.ADD]: 'purchases/new',
          [B.DETAILS]: 'purchases/detail',
          [B.EDIT]: 'purchases/edit',
        },
      },
      [TABS.SALES]: {
        initialRouteName: S.LIST,
        screens: {
          [S.LIST]: 'sales',
          [S.ADD]: 'sales/new',
          [S.DETAILS]: 'sales/detail',
          [S.EDIT]: 'sales/edit',
        },
      },
      [TABS.MORE]: {
        initialRouteName: M.MENU,
        screens: {
          [M.MENU]: 'more',
          [M.ANIMALS]: {
            initialRouteName: A.LIST,
            screens: {
              [A.LIST]: 'animals',
              [A.ADD]: 'animals/new',
              [A.DETAILS]: 'animals/:animalId',
              [A.EDIT]: 'animals/:animalId/edit',
            },
          },
          [M.PROFILE]: 'profile',
          [M.SETTINGS]: 'settings',
          [V.LIST]: 'sellers',
          [V.ADD]: 'sellers/new',
          [V.DETAILS]: 'sellers/:sellerId',
          [V.EDIT]: 'sellers/:sellerId/edit',
          [V.BILLING]: 'seller-billing',
          [C.LIST]: 'customers',
          [C.ADD]: 'customers/new',
          [C.DETAILS]: 'customers/:customerId',
          [C.EDIT]: 'customers/:customerId/edit',
          [C.BILLING]: 'customer-billing',
          [E.SCREEN]: 'employees',
          [E.ADD_EMPLOYEE]: 'employees/new',
          [E.ADD_SALARY]: 'employees/salary/new',
          [E.ADD_SALARY_TRANSACTION]: 'employees/salary/transaction',
          [X.LIST]: 'expenses',
          [X.ADD]: 'expenses/new',
          [X.DETAILS]: 'expenses/:expenseId',
          [R.LIST]: 'breeding',
          [R.ADD]: 'breeding/new',
          [R.EDIT]: 'breeding/edit',
          [I.LIST]: 'vaccines',
          [I.ADD]: 'vaccines/new',
        },
      },
    },
  },
  getPathFromState(state, options) {
    // Keep whole records and nested filter objects out of browser URLs.
    const clean = value => ({
      ...value,
      routes: value.routes.map(route => ({
        ...route,
        params: route.params
          ? Object.fromEntries(
              Object.entries(route.params).filter(([, item]) =>
                ['string', 'number', 'boolean'].includes(typeof item),
              ),
            )
          : undefined,
        state: route.state ? clean(route.state) : undefined,
      })),
    });
    return serializeState(clean(state), options);
  },
  getStateFromPath(path, options) {
    return parsePath(path, options);
  },
};
