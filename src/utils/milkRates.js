/**
 * milkRates.js
 *
 * Helpers for the `milkRates` object carried on Seller/Customer entities:
 *   milkRates: {
 *     buffaloMilkRate: number | null,
 *     cowMilkRate: number | null
 *   }
 */

/**
 * Returns the configured milk rate for a given animal type from a seller
 * or customer's `milkRates`. Returns null when the party has no rates
 * set or the animal type is not COW/BUFFALO.
 */
export const getMilkRateForType = (party, animalType) => {
  if (!party || !party.milkRates) {
    return null;
  }
  if (animalType === 'BUFFALO') {
    return party.milkRates.buffaloMilkRate ?? null;
  }
  if (animalType === 'COW') {
    return party.milkRates.cowMilkRate ?? null;
  }
  return null;
};