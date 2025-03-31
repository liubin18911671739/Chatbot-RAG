import { test, expect } from '@playwright/test';
const baseUrl = 'http://localhost:5000';
const pathName = '/';
const pathUrl = '/api/chat';
const endPoint = `${baseUrl}${pathName}${pathUrl}`;

test.describe('聊天功能 /api/chat', () => {
  test('POST: Should return success', async ({ request }) => {
    const response = await request.post(`${endPoint}`, {
      data: {
        "prompt": "你好，请问什么是中国特色社会主义？",
        "scene_id": "db_sizheng",
        "studentId": "2023001"
}
    });
    expect(response.status()).toBe(200);
  });
});
