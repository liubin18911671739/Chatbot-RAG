import { chatService } from '../../src/api/chatService';

// filepath: f:\project\iChat\rag-qa-system\frontend\cypress\e2e\chatService.cy.test.js

/// <reference types="cypress" />

describe('Chat Service API Testing', () => {
  beforeEach(() => {
    // 全局拦截器设置
    cy.intercept('GET', '**/api/greeting', {
      statusCode: 200,
      body: { message: '您好！我是AI助手，有什么可以帮您？' }
    }).as('getGreeting');

    cy.intercept('GET', '**/api/scenes', {
      statusCode: 200,
      body: [
        { id: 1, name: '场景1', pinyin: 'changjing1' },
        { id: 2, name: '场景2', pinyin: 'changjing2' }
      ]
    }).as('getScenes');
  });

  describe('getGreeting()', () => {
    it('should get greeting message', () => {
      cy.wrap(chatService.getGreeting())
        .its('data')
        .should('have.property', 'message')
        .and('equal', '您好！我是AI助手，有什么可以帮您？');
      
      cy.wait('@getGreeting');
    });

    it('should handle error when fetching greeting fails', () => {
      cy.intercept('GET', '**/api/greeting', {
        statusCode: 500,
        body: { error: 'Internal Server Error' }
      }).as('getGreetingError');

      cy.wrap(chatService.getGreeting())
        .should('be.rejected');
      
      cy.wait('@getGreetingError');
    });
  });

  describe('getScenes()', () => {
    it('should get list of scenes', () => {
      cy.wrap(chatService.getScenes())
        .its('data')
        .should('have.length', 2);
      
      cy.wait('@getScenes');
    });

    it('should contain correct scene data structure', () => {
      cy.wrap(chatService.getScenes())
        .its('data.0')
        .should('have.all.keys', ['id', 'name', 'pinyin']);
      
      cy.wait('@getScenes');
    });
  });

  describe('sendChatMessage()', () => {
    const testPrompt = '测试问题';
    const testStudentId = 'test123';
    const testScene = 'general';

    beforeEach(() => {
      // 设置默认聊天响应
      cy.intercept('POST', '**/api/chat', {
        statusCode: 200,
        body: {
          response: '这是一个测试回复',
          sources: [
            { title: '测试文档', document: 'test.pdf' }
          ]
        }
      }).as('sendChat');
    });

    it('should send chat message and receive response', () => {
      cy.wrap(chatService.sendChatMessage(testPrompt, testStudentId, testScene))
        .its('data')
        .should('have.property', 'response')
        .and('equal', '这是一个测试回复');
      
      cy.wait('@sendChat').its('request.body').should('deep.equal', {
        student_id: testStudentId,
        prompt: testPrompt,
        card_pinyin: testScene
      });
    });

    it('should handle chat with default parameters', () => {
      const testPrompt = '默认参数测试';

      cy.wrap(chatService.sendChatMessage(testPrompt))
        .its('data')
        .should('have.property', 'sources')
        .and('have.length', 1);
      
      cy.wait('@sendChat').its('request.body').should('deep.include', {
        student_id: '未知用户',
        prompt: testPrompt,
        card_pinyin: null
      });
    });

    it('should handle error response', () => {
      // 修改：使用单独的别名和不同的拦截器
      cy.intercept('POST', '**/api/chat', {
        statusCode: 400,
        body: { 
          response: null,
          status: 'error',
          message: '请求参数错误',
          sensitive_words: ['敏感词1', '敏感词2']
        }
      }).as('chatError');

      // 修改：先使用then处理可能的错误
      cy.wrap(chatService.sendChatMessage('包含敏感词的问题'))
        .then(response => {
          // 验证响应中包含错误信息
          expect(response.data).to.have.property('status', 'error');
          expect(response.data).to.have.property('sensitive_words').that.is.an('array');
        });
      
      cy.wait('@chatError');
    });
  });

  describe('sendFeedback()', () => {
    beforeEach(() => {
      cy.intercept('POST', '**/api/feedback', {
        statusCode: 200,
        body: { success: true, message: '反馈已收到' }
      }).as('sendFeedback');
    });

    it('should send feedback data successfully', () => {
      const feedbackData = {
        student_id: 'test123',
        message_id: 'msg456',
        rating: 5,
        comments: '非常有帮助的回答'
      };

      cy.wrap(chatService.sendFeedback(feedbackData))
        .its('data')
        .should('have.property', 'success', true);
      
      cy.wait('@sendFeedback').its('request.body').should('deep.equal', feedbackData);
    });

    it('should handle feedback submission error', () => {
      cy.intercept('POST', '**/api/feedback', {
        statusCode: 500,
        body: { success: false, message: '服务器错误' }
      }).as('feedbackError');

      const feedbackData = {
        student_id: 'test123',
        rating: -1  // 无效评分
      };

      cy.wrap(chatService.sendFeedback(feedbackData))
        .its('data')
        .should('have.property', 'success', false);
      
      cy.wait('@feedbackError');
    });
  });

  describe('checkApiConnection()', () => {
    it('should check API connection status - success', () => {
      cy.intercept('GET', '**/api/greeting', {
        statusCode: 200,
        body: { message: 'Connected' }
      }).as('connectionCheck');

      cy.wrap(chatService.checkApiConnection()).should('be.true');
      cy.wait('@connectionCheck');
    });

    it('should check API connection status - failure', () => {
      cy.intercept('GET', '**/api/greeting', {
        forceNetworkError: true
      }).as('connectionFail');

      cy.wrap(chatService.checkApiConnection()).should('be.false');
      cy.wait('@connectionFail');
    });
  });

  describe('getFallbackGreeting()', () => {
    it('should return fallback greeting', () => {
      cy.wrap(chatService.getFallbackGreeting())
        .its('data')
        .should('have.property', 'message')
        .and('include', '网络连接失败');
    });
  });
});