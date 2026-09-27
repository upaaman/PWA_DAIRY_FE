/**
 * The Dashboard is the one screen whose date filter opens on "Today"
 * rather than "This Month" — it is a "how is the farm doing right now"
 * glance, and every other screen still defaults to the month.
 *
 * Pinned here at the level the API actually sees, so a stray copy-paste
 * of the This Month default cannot creep back in unnoticed.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { toISODateString } from '../src/utils/date';

// Never resolves: the screen stays in its loading state, so the only
// thing that happens is the request going out with the right dates —
// which is the whole point of the test. A resolving mock would only add
// a state change (and an act() warning) after mount.
const mockGet = jest.fn(() => new Promise(() => {}));

jest.mock('../src/api/decentralizedWrapper', () => ({
  get: (...args) => mockGet(...args),
  post: () => Promise.resolve({}),
  put: () => Promise.resolve({}),
  del: () => Promise.resolve({}),
}));

// The screen loads its data from useFocusEffect, so the stub has to
// behave like the real hook — run the effect once on mount — rather
// than just standing in for it.
jest.mock('@react-navigation/native', () => {
  const { useEffect } = require('react');
  // Mount-only on purpose — the real hook re-runs when focus changes,
  // and this screen has no navigator to change focus here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return { useFocusEffect: effect => useEffect(() => effect(), []) };
});

const DashboardScreen = require('../src/screens/Dashboard').default;

const today = () => toISODateString(new Date());
const thisMonthStart = () => {
  const date = new Date();
  date.setDate(1);
  return toISODateString(date);
};

const renderDashboard = async () => {
  let tree;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<DashboardScreen />);
  });
  return tree;
};

beforeEach(() => {
  mockGet.mockClear();
});

test('requests only today on first load, not the month so far', async () => {
  await renderDashboard();

  expect(mockGet).toHaveBeenCalledTimes(1);
  const [url] = mockGet.mock.calls[0];
  expect(url).toBe(`/dashboard?startDate=${today()}&endDate=${today()}`);

  // Guards the test itself: on the 1st of the month, today and the
  // month-start are the same string, so this assertion is what keeps
  // the expectation above honest for the rest of the month.
  if (today() !== thisMonthStart()) {
    expect(url).not.toContain(`startDate=${thisMonthStart()}`);
  }
});
