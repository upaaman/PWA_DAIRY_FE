/**
 * employeeEnums.js
 *
 * Shared option/label mappings for the Employee module (Employee, Salary,
 * SalaryTransaction). The SalaryTransaction `type` mirrors the backend's
 * salary transaction enum — SALARY_CREDIT and PAYMENT are confirmed.
 */

export const EMPLOYEE_STATUS_OPTIONS = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false },
];

export const getEmployeeStatusLabel = status => {
  if (status === true) {
    return 'Active';
  }
  if (status === false) {
    return 'Inactive';
  }
  return '—';
};

export const SALARY_TRANSACTION_TYPES = {
  SALARY_CREDIT: 'Salary Credit',
  PAYMENT: 'Payment',
};

export const getSalaryTransactionTypeLabel = type =>
  SALARY_TRANSACTION_TYPES[type] || type || '—';

export const SALARY_TRANSACTION_TYPE_OPTIONS = Object.entries(
  SALARY_TRANSACTION_TYPES,
).map(([value, label]) => ({ label, value }));