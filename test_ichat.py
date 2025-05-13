import json
import requests
import random
import time
import os

# API URL
API_URL = "http://10.10.15.210:5000/api/chat"
QUESTIONS_FILE = "test_questions.json"
RESULTS_FILE = "result.txt"
NUMBER_OF_REQUESTS = 20

# 设置环境变量禁用HTTP代理 (如果需要)
os.environ['HTTP_PROXY'] = ''
os.environ['HTTPS_PROXY'] = ''
os.environ['NO_PROXY'] = '*'

def load_questions(filename):
    """从JSON文件加载问题。"""
    print(f"正在从 {filename} 加载问题...")
    try:
        with open(filename, "r", encoding="utf-8") as f:
            data = json.load(f)
            # 假设文件直接是一个问题列表，或者是一个包含 'questions' 键的字典
            if isinstance(data, list):
                # 如果列表中的元素是字符串
                if all(isinstance(item, str) for item in data):
                    questions = [{"question": q} for q in data]
                # 如果列表中的元素是字典且包含 "question" 键
                elif all(isinstance(item, dict) and "question" in item for item in data):
                    questions = data
                # 或者假设问题在某个特定键下，例如 "问题" (与 verify_api_responses.py 类似)
                elif all(isinstance(item, dict) and "问题" in item for item in data):
                    questions = [{"question": item["问题"]} for item in data]
                else:
                    print(f"错误: {filename} 中的问题格式无法识别。期望是字符串列表或包含 'question'/'问题' 键的字典列表。")
                    return []
            elif isinstance(data, dict) and "questions" in data:
                questions = [{"question": q} for q in data["questions"]]
            else:
                print(f"错误: {filename} 的格式不正确。期望是一个问题列表或包含 'questions' 键的字典。")
                return []
        print(f"成功加载 {len(questions)} 个问题。")
        return questions
    except FileNotFoundError:
        print(f"错误: 文件 {filename} 未找到。")
        return []
    except json.JSONDecodeError:
        print(f"错误: 解析JSON文件 {filename} 失败。")
        return []
    except Exception as e:
        print(f"加载问题时发生未知错误: {e}")
        return []

def run_stress_test():
    """执行API压力测试。"""
    questions_data = load_questions(QUESTIONS_FILE)
    if not questions_data:
        print("没有问题可供测试，正在退出。")
        return

    if len(questions_data) < NUMBER_OF_REQUESTS:
        print(f"警告: 问题数量 ({len(questions_data)}) 少于请求的测试数量 ({NUMBER_OF_REQUESTS})。将测试所有可用问题。")
        samples = questions_data
    else:
        samples = random.sample(questions_data, NUMBER_OF_REQUESTS)
    
    print(f"随机抽取了 {len(samples)} 个问题进行测试。")

    results = []
    total_response_time = 0
    successful_requests = 0

    print(f"开始对 {API_URL} 进行压力测试...")
    for i, item in enumerate(samples):
        question_text = item.get("question", "无效问题") # 从字典中获取问题
        if question_text == "无效问题":
            print(f"警告: 跳过一个格式不正确的问题项: {item}")
            results.append({
                "问题": "无效问题项",
                "答案": "N/A",
                "响应时间(秒)": 0,
                "状态": "跳过"
            })
            continue

        start_time = time.time()
        response_data = None
        status = "失败"
        error_message = ""

        try:
            response = requests.post(
                API_URL,
                json={"prompt": question_text},
                headers={
                    "Content-Type": "application/json",
                    "Connection": "close"
                },
                timeout=60,  # 增加超时时间以应对可能的慢响应
                proxies={"http": None, "https": None}
            )
            end_time = time.time()
            response_time = end_time - start_time
            total_response_time += response_time

            if response.status_code == 200:
                try:
                    api_response_json = response.json()
                    # 假设API返回的JSON中有一个'response'字段包含答案
                    # 或者直接就是答案字符串，或者其他结构
                    if "response" in api_response_json:
                        response_data = api_response_json["response"]
                    elif "answer" in api_response_json: # 备选字段
                        response_data = api_response_json["answer"]
                    else: # 如果没有明确的答案字段，尝试将整个响应作为答案
                        response_data = json.dumps(api_response_json, ensure_ascii=False)
                    
                    # 清理 <深度思考> 标签 (与 verify_api_responses.py 类似)
                    if isinstance(response_data, str):
                        response_data = re.sub(r'<深度思考>[\s\S]*?</深度思考>', '', response_data)
                        response_data = re.sub(r'\\n{3,}', '\\n\\n', response_data).strip()

                    status = "成功"
                    successful_requests += 1
                except json.JSONDecodeError:
                    response_data = "响应不是有效的JSON"
                    error_message = "JSON解析错误"
            else:
                response_data = f"HTTP错误: {response.status_code}"
                error_message = f"HTTP {response.status_code}"
        
        except requests.exceptions.Timeout:
            end_time = time.time() # 记录超时发生的时间
            response_time = end_time - start_time
            total_response_time += response_time # 即使超时，也计入总时间
            response_data = "请求超时"
            error_message = "超时"
        except requests.exceptions.RequestException as e:
            end_time = time.time() # 记录异常发生的时间
            response_time = end_time - start_time # 粗略计算时间
            # total_response_time += response_time # 发生连接等错误时，响应时间意义不大，可以选择不计入平均值
            response_data = f"请求异常: {str(e)}"
            error_message = f"请求错误: {str(e)}"
        
        results.append({
            "问题": question_text,
            "答案": response_data,
            "响应时间(秒)": f"{response_time:.4f}",
            "状态": status
        })
        print(f"问题 #{i+1}/{len(samples)}: \"{question_text[:50]}...\" - 状态: {status}, 时间: {response_time:.4f}s")
        time.sleep(0.1) # 短暂休眠，避免过于密集地发送请求

    # 计算统计数据
    average_response_time = total_response_time / len(samples) if samples else 0
    success_rate = (successful_requests / len(samples)) * 100 if samples else 0

    # 保存结果到文件
    print(f"\n正在将结果保存到 {RESULTS_FILE}...")
    try:
        with open(RESULTS_FILE, "w", encoding="utf-8") as f:
            f.write(f"API压力测试结果 ({time.strftime('%Y-%m-%d %H:%M:%S')})\n")
            f.write("="*50 + "\n")
            f.write(f"测试API: {API_URL}\n")
            f.write(f"测试问题来源: {QUESTIONS_FILE}\n")
            f.write(f"测试请求总数: {len(samples)}\n")
            f.write(f"成功请求数: {successful_requests}\n")
            f.write(f"成功率: {success_rate:.2f}%\n")
            f.write(f"总响应时间: {total_response_time:.4f} 秒\n")
            f.write(f"平均响应时间: {average_response_time:.4f} 秒/请求\n")
            f.write("="*50 + "\n\n")
            f.write("详细结果:\n")
            for i, res in enumerate(results):
                f.write("-"*30 + f"\n请求 #{i+1}\n")
                f.write(f"问题: {res['问题']}\n")
                f.write(f"答案: {res['答案']}\n")
                f.write(f"响应时间(秒): {res['响应时间(秒)']}\n")
                f.write(f"状态: {res['状态']}\n\n")
        print(f"结果已成功保存到 {RESULTS_FILE}")
    except IOError as e:
        print(f"错误: 无法写入结果文件 {RESULTS_FILE}: {e}")

    # 输出统计信息到控制台
    print("\n=== 测试摘要 ===")
    print(f"测试请求总数: {len(samples)}")
    print(f"成功请求数: {successful_requests}")
    print(f"成功率: {success_rate:.2f}%")
    print(f"平均响应时间: {average_response_time:.4f} 秒/请求")
    if successful_requests < len(samples):
        print(f"失败/错误请求数: {len(samples) - successful_requests}")

if __name__ == "__main__":
    # 为了能正确处理<深度思考>标签，需要导入re模块
    import re
    run_stress_test()
