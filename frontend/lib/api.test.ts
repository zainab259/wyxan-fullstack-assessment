import { ApiError, api } from './api';

describe('API request errors', () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });

  it('preserves HTTP 404 status so site navigation can show a missing page', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'No site exists at nowhere.zz.' }),
    } as Response);
    await expect(api.site('nowhere.zz')).rejects.toMatchObject({
      name: 'ApiError', status: 404, message: 'No site exists at nowhere.zz.',
    });
  });

  it('keeps server failures distinct from missing addresses', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ message: 'Database unavailable.' }),
    } as Response);
    await expect(api.site('nature.zz')).rejects.toBeInstanceOf(ApiError);
    await expect(api.site('nature.zz')).rejects.toMatchObject({ status: 503, message: 'Database unavailable.' });
  });

  it('reports a network failure without inventing an HTTP status', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('offline'));
    await expect(api.site('nature.zz')).rejects.toThrow('The backend could not be reached. Check that the API is running.');
  });
});
