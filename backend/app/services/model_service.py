import requests
import os
from flask import current_app

class ModelService:
    def __init__(self):
        # Ollama服务URL，可从环境变量或配置中获取
        self.ollama_url = current_app.config.get('OLLAMA_URL', 'http://localhost:11434')
        self.model_name = current_app.config.get('MODEL_NAME', 'deepseek-r1:1.5b')
    
    def generate_response(self, prompt, max_length=150, temperature=0.7):
        """
        使用Ollama API生成响应
        :param prompt: 输入提示词
        :param max_length: 最大输出长度
        :param temperature: 温度参数（较高值增加随机性）
        :return: 模型生成的文本响应
        """
        try:
            # 准备请求数据
            data = {
                "model": self.model_name,
                "prompt": prompt,
                "max_tokens": max_length,
                "temperature": temperature,
                "stream": False
            }
            
            # 发送HTTP请求至Ollama API
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json=data,
                timeout=60  # 60秒超时
            )
            
            # 检查API调用是否成功
            if response.status_code == 200:
                result = response.json()
                return result.get("response", "无法获取回复")
            else:
                current_app.logger.error(f"Ollama API错误: {response.status_code} - {response.text}")
                return f"API调用失败，状态码: {response.status_code}"
                
        except Exception as e:
            current_app.logger.error(f"调用Ollama时出错: {str(e)}")
            return f"生成回复时发生错误: {str(e)}"

    def generate_multimodal_response(self, prompt, max_length=150):
        """
        用于多模态响应的方法（当前仅支持文本）
        """
        # 目前Ollama主要支持文本生成，多模态功能需要额外实现
        text_response = self.generate_response(prompt, max_length)
        
        return {
            'text': text_response,
            'image': None,  # 将来可能需要单独的图像生成服务
            'chart': None   # 将来可能需要单独的图表生成服务
        }