from google import genai
from google.genai import types

client = genai.Client(api_key="AIzaSyAZqjyE7wN3Mh81S-bfITb98lA0SISANBY")  # 请替换为实际的 API Key

# 根据场景 ID 可以添加不同的系统提示词
system_instruction = "你是高校的AI助手，请对问题提供的详细答案，如果不知道就回答不知道，不要进行推理和联想。"

# 构建对话内容
conversation_content = "如何去北京？"# 调用 Gemini API
response = client.models.generate_content(
        model="gemini-2.0-flash-lite",
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.3,
            max_output_tokens=2000
        ),
        contents=conversation_content
    )

print(response.text)