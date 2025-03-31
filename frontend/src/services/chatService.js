import axios from 'axios';

class ChatService {
  async checkApiConnection() {
    try {
      console.log('正在检查API连接...');
      // 先尝试greeting端点
      const response = await axios.get('/api/greeting', { timeout: 5000 });
      console.log('API连接成功:', response.status, response.data);
      return true;
    } catch (error) {
      console.error('API连接失败详情:', error);
      
      // 提供详细的错误信息以便调试
      if (error.response) {
        // 服务器返回了非2xx响应
        console.error(`服务器返回错误码: ${error.response.status}`);
        console.error('响应数据:', error.response.data);
      } else if (error.request) {
        // 请求已发送但没有收到响应
        console.error('未收到服务器响应，可能API服务未运行或网络问题');
        console.error('请求详情:', error.request);
      } else {
        // 请求设置有问题
        console.error('请求设置错误:', error.message);
      }
      
      // 尝试备用健康检查端点
      try {
        console.log('尝试备用API健康检查...');
        const healthResponse = await axios.get('/api/health', { timeout: 5000 });
        console.log('备用API连接成功:', healthResponse.status);
        return true;
      } catch (healthError) {
        console.error('备用API连接也失败');
        return false;
      }
    }
  }

  async sendChatMessage(prompt, sceneId = null) {
    try {
      const payload = { prompt };
      if (sceneId) {
        payload.scene_id = sceneId;
      }
      
      const response = await axios.post('/api/chat', payload);
      return response.data;
    } catch (error) {
      console.error('发送聊天消息失败:', error);
      throw error;
    }
  }

  async getScenes() {
    try {
      const response = await axios.get('/api/scenes');
      return response.data;
    } catch (error) {
      console.error('获取场景列表失败:', error);
      throw error;
    }
  }
  
  async sendFeedback(feedbackData) {
    try {
      const response = await axios.post('/api/feedback', feedbackData);
      return response.data;
    } catch (error) {
      console.error('发送反馈失败:', error);
      throw error;
    }
  }
}

export default new ChatService();