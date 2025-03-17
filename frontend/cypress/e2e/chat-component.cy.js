/// <reference types="cypress" />

import { chatService } from '../../src/api/chatService';

describe('ChatComponent 测试', () => {
  // 处理未捕获的异常
  Cypress.on('uncaught:exception', (err, runnable) => {
    return false; // 阻止Cypress失败，让测试继续运行
  });

  beforeEach(() => {
    // 模拟欢迎消息响应
    cy.intercept('GET', '/api/greeting', {
      statusCode: 200,
      body: { message: '你好！欢迎使用AI助手。' }
    }).as('getGreeting');

    // 模拟聊天消息响应
    cy.intercept('POST', '/api/chat', {
      statusCode: 200,
      body: {
        response: '这是一个测试回复',
        sources: [
          { title: '测试文档1', document: 'doc1.pdf' },
          { title: '测试文档2', document: 'doc2.pdf' }
        ],
        attachment_data: []
      }
    }).as('sendChat');

    // 访问包含ChatComponent的测试页面
    cy.visit('/test-chat-component.html', {
      onBeforeLoad(win) {
        // 创建一个全局变量来挂载组件
        win.mountChatComponent = () => {
          const app = win.Vue.createApp({
            template: `
              <div>
                <chat-component 
                  scene-id="test-scene"
                  user-id="test-user"
                />
              </div>
            `,
            components: {
              'chat-component': win.ChatComponent
            }
          });
          app.mount('#app');
        };
      }
    });
  });

  it('应正确加载并显示欢迎消息', () => {
    cy.wait('@getGreeting');

    // 验证欢迎消息已显示
    cy.get('.message.assistant').should('exist');
    cy.get('.message.assistant .message-content').should('contain', '欢迎使用AI助手');
  });

  it('应能发送消息并显示用户消息', () => {
    cy.wait('@getGreeting');

    // 输入消息
    cy.get('.input-area input').type('这是一个测试问题');
    
    // 点击发送按钮
    cy.get('.input-area button').click();
    
    // 验证用户消息已显示
    cy.get('.message.user').should('exist');
    cy.get('.message.user .message-content').should('contain', '这是一个测试问题');
  });

  it('应能接收并显示AI回复', () => {
    cy.wait('@getGreeting');

    // 输入并发送消息
    cy.get('.input-area input').type('这是一个测试问题');
    cy.get('.input-area button').click();
    
    // 等待API响应
    cy.wait('@sendChat');
    
    // 验证AI消息已显示
    cy.get('.message.assistant').should('have.length.at.least', 1);
    cy.get('.message.assistant').last().find('.message-content').should('contain', '这是一个测试回复');
  });

  it('应正确显示参考来源', () => {
    cy.wait('@getGreeting');

    // 输入并发送消息
    cy.get('.input-area input').type('请提供一些参考资料');
    cy.get('.input-area button').click();
    
    // 等待API响应
    cy.wait('@sendChat');
    
    // 验证参考来源已显示
    cy.get('.message.assistant').last().find('.sources').should('exist');
    cy.get('.message.assistant').last().find('.sources-title').should('contain', '参考来源');
    cy.get('.message.assistant').last().find('.sources li').should('have.length', 2);
    cy.get('.message.assistant').last().find('.sources li').first().should('contain', '测试文档1');
  });

  it('应正确处理错误情况', () => {
    // 模拟API错误
    cy.intercept('POST', '/api/chat', {
      statusCode: 200,
      body: {
        status: 'error',
        message: '服务器处理失败'
      }
    }).as('chatError');

    cy.wait('@getGreeting');

    // 输入并发送消息
    cy.get('.input-area input').type('触发错误');
    cy.get('.input-area button').click();
    
    // 等待API响应
    cy.wait('@chatError');
    
    // 验证错误消息已显示
    cy.get('.error-message').should('exist');
    cy.get('.error-message').should('contain', '处理失败');
  });

  it('应正确处理敏感词错误', () => {
    // 模拟敏感词错误
    cy.intercept('POST', '/api/chat', {
      statusCode: 200,
      body: {
        status: 'error',
        sensitive_words: ['敏感词1', '敏感词2']
      }
    }).as('sensitiveError');

    cy.wait('@getGreeting');

    // 输入并发送消息
    cy.get('.input-area input').type('包含敏感词的消息');
    cy.get('.input-area button').click();
    
    // 等待API响应
    cy.wait('@sensitiveError');
    
    // 验证敏感词错误已显示
    cy.get('.error-message').should('exist');
    cy.get('.error-message').should('contain', '敏感词');
    cy.get('.error-message').should('contain', '敏感词1');
  });

  it('应禁用发送按钮当输入为空时', () => {
    cy.wait('@getGreeting');

    // 检查按钮默认状态
    cy.get('.input-area button').should('be.disabled');
    
    // 输入文本后按钮应可用
    cy.get('.input-area input').type('测试');
    cy.get('.input-area button').should('not.be.disabled');
    
    // 清空输入后按钮应再次禁用
    cy.get('.input-area input').clear();
    cy.get('.input-area button').should('be.disabled');
  });

  it('应在消息发送过程中显示加载指示器', () => {
    // 模拟延迟响应
    cy.intercept('POST', '/api/chat', {
      statusCode: 200,
      body: { response: '延迟回复' },
      delay: 1000
    }).as('delayedChat');

    cy.wait('@getGreeting');

    // 输入并发送消息
    cy.get('.input-area input').type('测试加载状态');
    cy.get('.input-area button').click();
    
    // 验证加载指示器显示
    cy.get('.typing-indicator').should('be.visible');
    cy.get('.typing-indicator').should('contain', '思考中');
    
    // 等待响应后，加载指示器应消失
    cy.wait('@delayedChat');
    cy.get('.typing-indicator').should('not.exist');
  });
});