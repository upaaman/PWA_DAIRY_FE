/**
 * salesMeta.js
 *
 * Helpers for the Milk Sales screens.
 *
 * IMPORTANT backend quirk: unlike /milkProduction/getAll, the real
 * GET /milkSale/getAll endpoint declares ALL of its query params as
 * required (startDate, endDate, shift, animalType, customerId — see
 * MilkSaleController.getAllMilkSale, none use `required = false`).
 * There is no "list everything" call available.
 *
 * To still show a real, complete Sales List without inventing a new
 * endpoint, we call the existing endpoint once per known
 * (customer × shift × animalType) combination for the selected date
 * range and merge the results client-side. Shift/AnimalType only have
 * 2 values each (real backend enums), and customers come from the
 * real GET /customer/getAll endpoint.
 */
import { get } from '../../api/decentralizedWrapper';
import { toQueryDateRange } from '../../utils/dateRanges';

const SHIFTS = ['MORNING', 'EVENING'];
const ANIMAL_TYPES = ['COW', 'BUFFALO'];

export const fetchCustomers = () => get('/customer/getAll');

/**
 * Fetches all MilkSale records in the given date range across every
 * customer/shift/animalType combination, using only the real endpoint.
 * Individual failed combinations are skipped rather than failing the
 * whole request (e.g. a customer with genuinely zero sales for a given
 * shift/type isn't a real error — the backend just returns []).
 */
export const fetchAllSalesInRange = async (range, customers) => {
  const { startDate, endDate } = toQueryDateRange(range);

  const requests = [];
  customers.forEach(customer => {
    SHIFTS.forEach(shift => {
      ANIMAL_TYPES.forEach(animalType => {
        const query =
          `?startDate=${startDate}&endDate=${endDate}` +
          `&shift=${shift}&animalType=${animalType}&customerId=${customer.id}`;
        requests.push(get(`/milkSale/getAll${query}`));
      });
    });
  });

  const results = await Promise.allSettled(requests);
  const sales = [];
  let hadFailure = false;

  results.forEach(result => {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      sales.push(...result.value);
    } else if (result.status === 'rejected') {
      hadFailure = true;
    }
  });

  // Only treat it as an error if every single combination failed
  // (e.g. the server is unreachable) — partial failures with at least
  // some successful data are shown as-is.
  if (hadFailure && sales.length === 0 && requests.length > 0) {
    throw new Error('Could not load sales. Please try again.');
  }

  return sales.sort((a, b) => (b.saleDate || '').localeCompare(a.saleDate || ''));
};
