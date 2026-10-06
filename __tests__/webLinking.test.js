import { linking } from '../web/linking';
import { TABS, PRODUCTION_ROUTES } from '../src/navigation/routes';
it('resolves a direct Add Production URL with a list to go back to', () => {
  const state = linking.getStateFromPath('/production/new', linking.config);
  const tab = state.routes[state.index ?? 0];
  expect(tab.name).toBe(TABS.PRODUCTION);
  expect(tab.state.routes.map(route => route.name)).toEqual([
    PRODUCTION_ROUTES.LIST,
    PRODUCTION_ROUTES.ADD,
  ]);
});
it('does not leak passed record objects into the URL', () => {
  const state = {
    routes: [
      {
        name: TABS.PRODUCTION,
        state: {
          routes: [
            {
              name: PRODUCTION_ROUTES.DETAILS,
              params: { record: { id: 3, privateNotes: 'private' } },
            },
          ],
        },
      },
    ],
  };
  expect(linking.getPathFromState(state, linking.config)).toBe(
    '/production/detail',
  );
});
it('routes unknown URLs to a not-found screen', () => {
  expect(
    linking.getStateFromPath('/unknown/path', linking.config).routes[0].name,
  ).toBe('WebNotFound');
});
