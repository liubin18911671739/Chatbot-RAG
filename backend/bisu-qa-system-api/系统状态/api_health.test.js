import { test, expect } from '@playwright/test';
const baseUrl = 'http://localhost:5000';
const pathName = '/';
const pathUrl = '/api/health';
const endPoint = `${baseUrl}${pathName}${pathUrl}`;

test.describe('系统状态 /api/health', () => {
  test('GET: Should return success', async ({ request }) => {
    const response = await request.get(`${endPoint}`, {
    });
    expect(response.status()).toBe(200);
  });
});
