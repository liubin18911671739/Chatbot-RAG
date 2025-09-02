// Mock Chat Service for Frontend Testing
// 模拟聊天服务，用于前端功能测试

class MockChatService {
  constructor() {
    this.mockDelay = 1000; // 默认1秒延迟
    this.conversationHistory = [];
    this.mockResponses = this.initMockResponses();
    this.mockScenes = this.initMockScenes();
  }

  // 初始化模拟回答数据库
  initMockResponses() {
    return {
      // 通用回答
      general: [
        "您好！我是北京第二外国语学院的AI助手，很高兴为您服务！",
        "感谢您的问题，让我为您查找相关信息...",
        "这是一个很好的问题，我来帮您解答。",
        "根据您的问题，我建议您可以这样做..."
      ],
      
      // 学习指导相关
      db_xuexizhidao: [
        "学习方法很重要，建议您制定合理的学习计划。",
        "对于语言学习，多听多说多练习是关键。",
        "考试复习时，建议您归纳总结重点知识。",
        "学习外语需要创造语言环境，多与同学交流。"
      ],
      
      // 思政学习相关
      db_zhihuisizheng: [
        "思政学习有助于提高思想觉悟和政治素养。",
        "建议您多关注时事政治，增强政治敏感性。",
        "参与社会实践活动，将理论与实践相结合。",
        "学习党的理论知识，树立正确的世界观。"
      ],
      
      // 科研辅助相关
      db_keyanfuzhu: [
        "科研需要严谨的态度和创新的思维。",
        "文献调研是科研的重要基础工作。",
        "实验设计要科学合理，确保结果的可靠性。",
        "学术写作要规范，注意引用格式的正确性。"
      ],
      
      // 网上办事厅相关
      db_wangshangbanshiting: [
        "您可以通过学校官网访问网上办事厅。",
        "大部分学务手续都可以在线办理。",
        "如需帮助，请联系相关部门的工作人员。",
        "办事流程请参考官方指南。"
      ],
      
      // 特定关键词回答
      keywords: {
        "你好": "您好！欢迎使用北京第二外国语学院智能问答系统！",
        "再见": "再见！祝您学习愉快，有问题随时联系我！",
        "谢谢": "不客气，很高兴能帮助到您！",
        "帮助": "我可以为您提供学习指导、思政教育、科研辅助、办事咨询等服务。请告诉我您需要什么帮助。",
        "学校": "北京第二外国语学院是一所以外语为特色的综合性大学，位于北京市朝阳区。",
        "专业": "学校设有多个语言类专业，包括英语、日语、德语、法语、西班牙语等。",
        "图书馆": "学校图书馆位于校园中心，提供丰富的中外文献资源和安静的学习环境。",
        "食堂": "校内有多个餐厅，提供各种口味的美食，价格实惠，营养健康。",
        "住宿": "学校提供学生宿舍，设施完善，管理规范，为同学们创造良好的住宿环境。"
      }
    };
  }

  // 初始化模拟场景数据
  initMockScenes() {
    return [
      {
        id: 'general',
        name: '通用助手',
        iconUrl: '/icons/general.png',
        description: '通用AI助手服务'
      },
      {
        id: 'db_xuexizhidao',
        name: '学习指导',
        iconUrl: '/icons/study.png',
        description: '学习方法和指导'
      },
      {
        id: 'db_zhihuisizheng',
        name: '思政学习',
        iconUrl: '/icons/politics.png',
        description: '思想政治教育'
      },
      {
        id: 'db_keyanfuzhu',
        name: '科研辅助',
        iconUrl: '/icons/research.png',
        description: '科研方法指导'
      },
      {
        id: 'db_wangshangbanshiting',
        name: '网上办事厅',
        iconUrl: '/icons/service.png',
        description: '校园事务办理'
      }
    ];
  }

  // 设置模拟延迟时间
  setMockDelay(delay) {
    this.mockDelay = delay;
  }

  // 模拟网络延迟
  async simulateDelay(customDelay = null) {
    const delay = customDelay || this.mockDelay;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // 根据输入生成智能回答
  generateSmartResponse(prompt, sceneId = 'general') {
    const lowerPrompt = prompt.toLowerCase();
    
    // 检查是否包含特定关键词
    for (const [keyword, response] of Object.entries(this.mockResponses.keywords)) {
      if (lowerPrompt.includes(keyword)) {
        return response;
      }
    }
    
    // 根据场景返回相应回答
    const sceneResponses = this.mockResponses[sceneId] || this.mockResponses.general;
    const randomIndex = Math.floor(Math.random() * sceneResponses.length);
    let response = sceneResponses[randomIndex];
    
    // 添加一些个性化元素
    if (prompt.length > 20) {
      response = `针对您提到的"${prompt.substring(0, 15)}..."问题，${response}`;
    }
    
    return response;
  }

  // 模拟发送聊天消息
  async sendChatMessage(prompt, sceneId = 'general', abortController = null) {
    console.log('🎭 Mock Chat Service: 发送消息', { prompt, sceneId });
    
    // 检查是否被取消
    if (abortController && abortController.signal.aborted) {
      throw new Error('Request was aborted');
    }
    
    // 模拟网络延迟
    await this.simulateDelay();
    
    // 再次检查是否被取消
    if (abortController && abortController.signal.aborted) {
      throw new Error('Request was aborted');
    }
    
    // 生成回答
    const response = this.generateSmartResponse(prompt, sceneId);
    
    // 保存到对话历史
    this.conversationHistory.push({
      timestamp: new Date().toISOString(),
      prompt,
      response,
      sceneId
    });
    
    // 返回模拟的API响应格式
    return {
      data: {
        status: 'success',
        response: response,
        attachment_data: [],
        special_note: '响应来自模拟服务 - 仅用于测试'
      }
    };
  }

  // 发送消息的简化方法
  async sendMessage(message, sceneId = 'general', abortController = null) {
    return this.sendChatMessage(message, sceneId, abortController);
  }

  // 获取可用场景列表
  async getScenes() {
    await this.simulateDelay(300); // 较短的延迟
    return {
      data: {
        status: 'success',
        scenes: this.mockScenes
      }
    };
  }

  // 获取问候语
  async getGreeting() {
    await this.simulateDelay(200);
    const greetings = [
      "欢迎使用北京第二外国语学院智能问答系统！",
      "您好！我是您的AI学习助手，有什么可以帮助您的吗？",
      "欢迎来到棠心问答！让我来为您答疑解惑。"
    ];
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    return {
      data: {
        status: 'success',
        greeting: randomGreeting
      }
    };
  }

  // 获取建议问题
  async getSuggestions(sceneId = 'general') {
    await this.simulateDelay(300);
    
    const suggestions = {
      general: [
        "学校有哪些社团活动？",
        "图书馆开放时间是什么？",
        "食堂菜品怎么样？",
        "如何申请奖学金？"
      ],
      db_xuexizhidao: [
        "如何提高英语口语水平？",
        "期末考试复习方法？",
        "怎样制定学习计划？",
        "学习压力大怎么办？"
      ],
      db_zhihuisizheng: [
        "如何理解新时代中国特色社会主义？",
        "大学生如何践行社会主义核心价值观？",
        "党的二十大精神要点是什么？",
        "如何参与志愿服务活动？"
      ],
      db_keyanfuzhu: [
        "如何选择研究课题？",
        "学术论文写作技巧？",
        "如何进行文献综述？",
        "实验数据如何分析？"
      ],
      db_wangshangbanshiting: [
        "如何在线申请成绩单？",
        "学籍证明怎么开？",
        "如何办理休学手续？",
        "奖学金申请流程？"
      ]
    };
    
    return {
      data: {
        status: 'success',
        suggestions: suggestions[sceneId] || suggestions.general
      }
    };
  }

  // 提交反馈
  async submitFeedback(rating, comment) {
    await this.simulateDelay(500);
    console.log('🎭 Mock Chat Service: 收到反馈', { rating, comment });
    
    return {
      data: {
        status: 'success',
        message: '感谢您的反馈，我们会继续改进服务质量！'
      }
    };
  }

  // 检查API连接（总是返回成功）
  async checkApiConnection() {
    await this.simulateDelay(100);
    console.log('🎭 Mock Chat Service: API连接检查 - 模拟成功');
    return true;
  }

  // 获取对话历史
  getConversationHistory() {
    return this.conversationHistory;
  }

  // 清除对话历史
  clearConversationHistory() {
    this.conversationHistory = [];
  }

  // 健康检查
  async healthCheck() {
    await this.simulateDelay(100);
    return {
      data: {
        status: 'ok',
        service: 'Mock Chat Service',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    };
  }
}

// 创建单例实例
const mockChatService = new MockChatService();

export default mockChatService;