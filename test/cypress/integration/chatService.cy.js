describe('chatService API Tests', () => {
  it('should fetch greeting successfully', () => {
    // 假设后端已在本地或指定URL运行
    cy.request('/greeting').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('greeting');
    });
  });

  it('should send a chat message', () => {
    // 示例请求体
    const payload = { prompt: '测试聊天消息' };

    cy.request('POST', '/chat', payload).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('answer');
    });
  });

  it('should get scenes', () => {
    cy.request('/scenes').then((response) => {
      expect(response.status).to.eq(200);
      // 根据实际返回的数据结构做断言
    });
  });
});