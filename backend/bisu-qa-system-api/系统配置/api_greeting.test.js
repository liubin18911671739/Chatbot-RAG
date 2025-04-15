import { test, expect } from '@playwright/test';
const baseUrl = 'http://10.10.15.210:5000';
const pathName = '/';
const pathUrl = '/api/greeting';
const endPoint = `${baseUrl}${pathName}${pathUrl}`;

test.describe('系统配置 /api/greeting', () => {
  test('GET: Should return success', async ({ request }) => {
    const response = await request.get(`${endPoint}`, {
    });
    expect(response.status()).toBe(200);
  });
});
