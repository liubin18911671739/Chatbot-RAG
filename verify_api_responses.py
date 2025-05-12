import json
import requests
import random
import time
import re
import os
from tqdm import tqdm

# 设置环境变量禁用HTTP代理
os.environ['HTTP_PROXY'] = ''
os.environ['HTTPS_PROXY'] = ''
os.environ['NO_PROXY'] = '*'

# 加载测试问答对
print("正在加载测试问答对...")
with open("test_qa_pairs.json", "r", encoding="utf-8") as f:
    qa_pairs = json.load(f)
print(f"加载了 {len(qa_pairs)} 个问答对")

# 随机抽样10个问题进行测试
samples = random.sample(qa_pairs, min(100, len(qa_pairs)))
print(f"随机抽取了 {len(samples)} 个问题进行测试")

results = []

print("开始测试API响应...")
for sample in tqdm(samples):
    question = sample["问题"]
    expected = sample["回答"]
    
    # 调用API
    try:
        # 明确设置不使用代理
        response = requests.post(
            "http://10.10.15.210:5000/api/chat",
            json={"prompt": question},
            headers={
                "Content-Type": "application/json",
                "Connection": "close"  # 添加这个可以帮助避免一些连接问题
            },
            timeout=30,
            proxies={"http": None, "https": None}  # 明确不使用代理
        )
        
        if response.status_code == 200:
            api_response = response.json()
            # 处理响应中的<深度思考>标签
            if "response" in api_response:
                # 使用正确的Python正则表达式语法
                cleaned_response = re.sub(
                    r'<深度思考>[\s\S]*?</深度思考>', 
                    '', 
                    api_response["response"]
                )
                # 处理多余换行符
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
print("保存测试结果...")
with open("api_test_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

# 输出统计信息
success_count = len([r for r in results if r["状态"] == "成功"])
print(f"测试完成! 成功率: {success_count}/{len(results)} ({success_count*100/len(results):.2f}%)")

# 输出详细报告
print("\n=== 详细测试报告 ===")
for i, result in enumerate(results):
    print(f"\n测试 #{i+1}:")
    print(f"问题: {result['问题'][:50]}..." if len(result['问题']) > 50 else f"问题: {result['问题']}")
    print(f"状态: {result['状态']}")
    if result['状态'] == "失败":
        print(f"失败原因: {result['实际回答']}")