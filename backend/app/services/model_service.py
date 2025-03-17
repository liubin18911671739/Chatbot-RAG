import requests
import os

class ModelService:
    def __init__(self):
        # 使用默认值初始化，延迟获取配置值
        self._ollama_url = None
        self._model_name = None
    
    @property
    def ollama_url(self):
        # 懒加载模式：仅在需要时获取配置
        if self._ollama_url is None:
            try:
                from flask import current_app
                self._ollama_url = current_app.config.get('OLLAMA_URL', 'http://localhost:11434')
            except RuntimeError:
                # 应用上下文不可用时使用默认值
                self._ollama_url = 'http://localhost:11434'
        return self._ollama_url
    
    @property
    def model_name(self):
        # 懒加载模式：仅在需要时获取配置
        if self._model_name is None:
            try:
                from flask import current_app
                self._model_name = current_app.config.get('MODEL_NAME', 'deepseek-r1:1.5b')
            except RuntimeError:
                # 应用上下文不可用时使用默认值
                self._model_name = 'deepseek-r1:1.5b'
        return self._model_name
    
    def generate_response(self, prompt, relevant_docs=None, max_length=150, temperature=0.7):
        """
        使用Ollama API生成响应
        :param prompt: 输入提示词
        :param relevant_docs: 相关文档（如果有）
        :param max_length: 最大输出长度
        :param temperature: 温度参数（较高值增加随机性）
        :return: 模型生成的文本响应
        """
        try:
            # 如果有相关文档，将其整合到提示中
            if relevant_docs:
                context = "\n\n".join([doc.get('content', '') for doc in relevant_docs])
                prompt = f"基于以下信息回答问题:\n\n{context}\n\n问题: {prompt}"
            
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
                try:
                    from flask import current_app
                    current_app.logger.error(f"Ollama API错误: {response.status_code} - {response.text}")
                except RuntimeError:
                    # 应用上下文不可用时简单打印错误
                    print(f"Ollama API错误: {response.status_code} - {response.text}")
                return f"API调用失败，状态码: {response.status_code}"
                
        except Exception as e:
            try:
                from flask import current_app
                current_app.logger.error(f"调用Ollama时出错: {str(e)}")
            except RuntimeError:
                # 应用上下文不可用时简单打印错误
                print(f"调用Ollama时出错: {str(e)}")
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