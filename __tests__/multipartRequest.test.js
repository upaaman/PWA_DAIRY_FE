import { post, postMultipart } from '../src/api/decentralizedWrapper';
const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});
it('leaves the multipart boundary to fetch while preserving JSON requests', async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ url: 'https://example.com/a.jpg' }),
    });
  const body = new FormData();
  body.append('file', {
    uri: 'file:///a.jpg',
    name: 'a.jpg',
    type: 'image/jpeg',
  });
  await postMultipart('/upload', body);
  expect(fetch.mock.calls[0][1].body).toBe(body);
  expect(fetch.mock.calls[0][1].headers['Content-Type']).toBeUndefined();
  await post('/animal/create', { name: 'Cow' });
  expect(fetch.mock.calls[1][1].headers['Content-Type']).toBe(
    'application/json',
  );
  expect(fetch.mock.calls[1][1].body).toBe('{"name":"Cow"}');
});
