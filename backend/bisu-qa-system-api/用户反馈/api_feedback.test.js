import { test, expect } from '@playwright/test';
const baseUrl = 'http://localhost:5000';
const pathName = '/';
const pathUrl = '/api/feedback';
const endPoint = `${baseUrl}${pathName}${pathUrl}`;

test.describe('用户反馈 /api/feedback', () => {
  test('POST: Should return success', async ({ request }) => {
    const response = await request.post(`${endPoint}`, {
      data: {
        "message_id": "msg_12345",
        "rating": 5,
        "comment": "回答非常有帮助！"
}
    });
    expect(response.status()).toBe(200);
  });
});
