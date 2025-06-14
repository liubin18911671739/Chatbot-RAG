import json
import requests
import random
import time
import re
from tqdm import tqdm

# 加载测试问答对
with open("test_qa_pairs.json", "r", encoding="utf-8") as f:
    qa_pairs = json.load(f)

# 随机抽样10个问题进行测试
samples = random.sample(qa_pairs, min(10, len(qa_pairs)))

results = []

for sample in tqdm(samples):
    question = sample["问题"]
    expected = sample["回答"]
    
    # 调用API
    try:
        response = requests.post(
            "http://10.10.15.210:5000/api/chat",
            json={"prompt": question},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            api_response = response.json()
            # 处理响应中的<深度思考>标签
            if "response" in api_response:
                cleaned_response = re.sub(
                    r'<深度思考>[\s\S]*?</深度思考>', '', api_response["response"]
                )
                cleaned_response = re.sub(r'\n{3,}', '\n\n', cleaned_response).strip()
                
                results.append({
                    "问题": question,
                    "期望回答": expected,
                    "实际回答": cleaned_response,
                    "状态": "成功"
                })
            else:
                results.append({
                    "问题": question,
                    "期望回答": expected,
                    "实际回答": "响应格式错误",
                    "状态": "失败"
                })
        else:
            results.append({
                "问题": question,
                "期望回答": expected,
                "实际回答": f"HTTP错误: {response.status_code}",
                "状态": "失败"
            })
    except Exception as e:
        results.append({
            "问题": question,
            "期望回答": expected,
            "实际回答": f"请求异常: {str(e)}",
            "状态": "失败"
        })
    
    # 避免请求过于频繁
    time.sleep(1)

# 保存结果
with open("api_test_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

# 输出统计信息
success_count = len([r for r in results if r["状态"] == "成功"])
print(f"测试完成! 成功率: {success_count}/{len(results)} ({success_count*100/len(results):.2f}%)")