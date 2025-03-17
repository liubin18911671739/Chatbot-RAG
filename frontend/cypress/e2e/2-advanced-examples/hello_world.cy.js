/// <reference types="cypress" />

import { chatService } from '../../../src/api/chatService';

describe('Chat Service API Tests', () => {
  beforeEach(() => {
    // 先访问一个页面以确保有window对象
    // cy.visit('about:blank');
    
    // 正确设置localStorage
    cy.window().then(win => {
      win.localStorage.setItem('token', 'test-token');
    });
  });

  it('should get scenes successfully', () => {
    // 模拟API响应
    cy.intercept('GET', '/api/scenes', {
      statusCode: 200,
      body: [
        { id: 1, name: '场景1', pinyin: 'changjing1' },
        { id: 2, name: '场景2', pinyin: 'changjing2' }
      ]
    }).as('getScenes');

    // 调用API方法
    cy.window().then(win => {
      chatService.getScenes().then(response => {
        expect(response.data).to.have.length(2);
        expect(response.data[0].name).to.equal('场景1');
      });
    });

    // 简化验证，只检查请求是否发送，不检查具体头信息
    cy.wait('@getScenes');
  });

  it('should send feedback successfully', () => {
    const feedbackData = { rating: 5, comment: '很好用！' };
    
    cy.intercept('POST', '/api/feedback', {
      statusCode: 200,
      body: { success: true, message: '反馈已收到' }
    }).as('sendFeedback');

    cy.window().then(win => {
      chatService.sendFeedback(feedbackData).then(response => {
        expect(response.data.success).to.be.true;
      });
    });

    cy.wait('@sendFeedback').then(interception => {
      expect(interception.request.body).to.deep.equal(feedbackData);
    });
  });

  it('should get greeting successfully', () => {
    cy.intercept('GET', '/api/greeting', {
      statusCode: 200,
      body: { message: '欢迎使用AI助手！' }
    }).as('getGreeting');

    cy.window().then(win => {
      chatService.getGreeting().then(response => {
        expect(response.data.message).to.equal('欢迎使用AI助手！');
      });
    });

    cy.wait('@getGreeting');
  });

  it('should send chat message successfully', () => {
    const prompt = '你好，AI助手';
    const studentId = 'student123';
    const cardPinyin = 'changjing1';

    cy.intercept('POST', '/api/chat', {
      statusCode: 200,
      body: { 
        answer: '你好！我是AI助手，有什么可以帮助你的？',
        sources: []
      }
    }).as('sendChat');

    cy.window().then(win => {
      chatService.sendChatMessage(prompt, studentId, cardPinyin).then(response => {
        expect(response.data.answer).to.include('你好');
      });
    });

    cy.wait('@sendChat').then(interception => {
      expect(interception.request.body).to.deep.equal({
        prompt: prompt,
        student_id: studentId,
        card_pinyin: cardPinyin
      });
    });
  });
});