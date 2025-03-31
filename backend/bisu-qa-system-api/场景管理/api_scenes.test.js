import { test, expect } from '@playwright/test';
const baseUrl = 'http://localhost:5000';
const pathName = '/';
const pathUrl = '/api/scenes';
const endPoint = `${baseUrl}${pathName}${pathUrl}`;

test.describe('场景管理 /api/scenes', () => {
  test('GET: Should return success', async ({ request }) => {
    const response = await request.get(`${endPoint}`, {
    });
    expect(response.status()).toBe(200);
  });
});
