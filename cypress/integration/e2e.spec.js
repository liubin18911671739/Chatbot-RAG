describe('E2E: Complete User Flow', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('completes registration and login flow', () => {
    // Navigate to registration
    cy.contains('注册').click()
    
    // Fill registration form
    cy.get('input[name="username"]').type('e2euser')
    cy.get('input[name="email"]').type('e2e@example.com')
    cy.get('input[name="password"]').type('testpass123')
    cy.get('button[type="submit"]').click()
    
    // Should redirect to login or show success message
    cy.url().should('include', '/login')
    
    // Login with new credentials
    cy.get('input[name="username"]').type('e2euser')
    cy.get('input[name="password"]').type('testpass123')
    cy.get('button[type="submit"]').click()
    
    // Should redirect to chat page
    cy.url().should('include', '/chat')
    
    // Verify user is logged in
    cy.contains('e2euser')
  })

  it('completes a chat interaction', () => {
    // Login first
    cy.login('testuser', 'testpass123')
    
    // Navigate to chat
    cy.visit('/chat')
    
    // Select a scene
    cy.get('.scene-card').first().click()
    
    // Type and send a message
    cy.get('input[type="text"]').type('你好，请问什么是中国特色社会主义?')
    cy.get('button[type="submit"]').click()
    
    // Wait for response
    cy.contains('中国特色社会主义', { timeout: 10000 })
    
    // Verify message appears in chat history
    cy.get('.message-user').should('contain', '你好')
    cy.get('.message-assistant').should('exist')
    
    // Check suggestions appear
    cy.get('.suggestions').should('be.visible')
  })

  it('searches for questions', () => {
    cy.login('testuser', 'testpass123')
    cy.visit('/questions')
    
    // Use search functionality
    cy.get('input[placeholder*="搜索"]').type('社会主义')
    cy.get('button[type="submit"]').click()
    
    // Verify search results
    cy.get('.search-results').should('be.visible')
    cy.get('.question-item').should('have.length.greaterThan', 0)
  })

  it('submits feedback', () => {
    cy.login('testuser', 'testpass123')
    cy.visit('/feedback')
    
    // Fill feedback form
    cy.get('textarea[name="message"]').type('这是一个测试反馈')
    cy.get('input[name="rating"]').check('5')
    cy.get('button[type="submit"]').click()
    
    // Verify success message
    cy.contains('感谢您的反馈')
  })

  it('navigates between scenes', () => {
    cy.login('testuser', 'testpass123')
    cy.visit('/scenes')
    
    // Verify scenes are displayed
    cy.get('.scene-card').should('have.length.greaterThan', 0)
    
    // Click on first scene
    cy.get('.scene-card').first().click()
    
    // Should navigate to chat with selected scene
    cy.url().should('include', '/chat')
    cy.get('.selected-scene').should('be.visible')
  })
})

describe('E2E: Admin Flow', () => {
  beforeEach(() => {
    cy.login('admin', 'adminpass123')
  })

  it('manages questions as admin', () => {
    cy.visit('/admin/questions')
    
    // Create new question
    cy.contains('新建问题').click()
    cy.get('input[name="question"]').type('E2E测试问题')
    cy.get('textarea[name="answer"]').type('E2E测试答案')
    cy.get('select[name="category"]').select('测试分类')
    cy.get('button[type="submit"]').click()
    
    // Verify question was created
    cy.contains('E2E测试问题')
    
    // Edit the question
    cy.contains('E2E测试问题').parent().find('.edit-button').click()
    cy.get('input[name="question"]').clear().type('更新的E2E问题')
    cy.get('button[type="submit"]').click()
    
    // Verify update
    cy.contains('更新的E2E问题')
    
    // Delete the question
    cy.contains('更新的E2E问题').parent().find('.delete-button').click()
    cy.contains('确认').click()
    
    // Verify deletion
    cy.contains('更新的E2E问题').should('not.exist')
  })

  it('views analytics dashboard', () => {
    cy.visit('/admin/analytics')
    
    // Verify dashboard elements
    cy.get('.stats-card').should('have.length.greaterThan', 0)
    cy.contains('总用户数')
    cy.contains('聊天消息数')
    cy.contains('问题数量')
  })

  it('reviews feedback', () => {
    cy.visit('/admin/feedback')
    
    // Verify feedback list
    cy.get('.feedback-item').should('exist')
    
    // Click on a feedback to view details
    cy.get('.feedback-item').first().click()
    
    // Verify details are displayed
    cy.get('.feedback-detail').should('be.visible')
  })
})

// Custom commands for Cypress
Cypress.Commands.add('login', (username, password) => {
  cy.visit('/login')
  cy.get('input[name="username"]').type(username)
  cy.get('input[name="password"]').type(password)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
})
