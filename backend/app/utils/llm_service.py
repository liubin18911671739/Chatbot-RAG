import os
import json
import requests
import time
from flask import current_app

class LLMService:
    """大语言模型服务接口，用于生成回答"""
    
    def __init__(self):
        self.api_key = os.environ.get('OPENAI_API_KEY', '')
        self.api_base = os.environ.get('OPENAI_API_BASE', 'https://api.openai.com/v1')
        self.default_model = 'gpt-3.5-turbo'
    
    def generate(self, prompt, model=None, temperature=0.7, max_tokens=800):
        """生成回答
        
        参数:
            prompt (str): 提示词
            model (str, optional): 模型名称. 默认为None，将使用默认模型
            temperature (float, optional): 温度参数. 默认为0.7
            max_tokens (int, optional): 最大生成token数. 默认为800
            
        返回:
            str: 生成的回答文本
        """
        try:
            model = model or self.default_model
            
            # 构建消息格式
            messages = [
                {"role": "system", "content": "你是一个智能助手，能够提供准确、有用的回答。"},
                {"role": "user", "content": prompt}
            ]
            
            # 尝试调用OpenAI API
            start_time = time.time()
            
            response = self._call_openai_api(messages, model, temperature, max_tokens)
            
            end_time = time.time()
            duration = end_time - start_time
            
            current_app.logger.info(f"LLM响应时间: {duration:.2f}秒")
            
            # 解析并返回回答
            if response and 'choices' in response and len(response['choices']) > 0:
                answer = response['choices'][0]['message']['content'].strip()
                return answer
            else:
                current_app.logger.error(f"无效的API响应: {response}")
                return "抱歉，我无法生成回答。请稍后再试。"
                
        except Exception as e:
            current_app.logger.error(f"LLM生成错误: {str(e)}")
            return "抱歉，生成回答时出现错误。请稍后再试。"
    
    def _call_openai_api(self, messages, model, temperature, max_tokens):
        """调用OpenAI API
        
        实际生产环境中，可能需要处理额外的API密钥管理、请求重试、错误处理等
        """
        if not self.api_key:
            # 模拟API响应用于开发和演示
            current_app.logger.warning("未找到OpenAI API密钥，返回模拟响应")
            return self._mock_openai_response(messages)
        
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            data = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            
            response = requests.post(
                f"{self.api_base}/chat/completions",
                headers=headers,
                data=json.dumps(data),
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                current_app.logger.error(
                    f"OpenAI API错误: {response.status_code}, {response.text}"
                )
                return None
                
        except Exception as e:
            current_app.logger.error(f"调用OpenAI API时出错: {str(e)}")
            return None
    
    def _mock_openai_response(self, messages):
        """生成模拟的OpenAI API响应，用于开发和测试"""
        # 提取用户消息
        user_message = ""
        for msg in messages:
            if msg["role"] == "user":
                user_message = msg["content"]
                break
        
        # 简单的模拟回答生成
        answer = f"这是对\"{user_message}\"的模拟回答。在实际部署中，此处将返回由OpenAI API生成的回答。"
        
        # 构建模拟的API响应格式
        mock_response = {
            "id": "mock-response-id",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": "gpt-3.5-turbo-mock",
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": answer
                    },
                    "finish_reason": "stop"
                }
            ],
            "usage": {
                "prompt_tokens": len(user_message) // 4,  # 粗略估计
                "completion_tokens": len(answer) // 4,
                "total_tokens": (len(user_message) + len(answer)) // 4
            }
        }
        
        return mock_response
