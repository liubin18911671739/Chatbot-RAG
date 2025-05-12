# 聊天API压力测试指南

## 准备工作

1. **转换Excel数据**
   
   ```bash
   python excel-to-csv.py
   ```
   
   运行后将生成：
   - `test_prompts.csv`: 包含测试问题
   - `test_qa_pairs.json`: 包含问答对，用于结果验证

2. **下载安装JMeter**
   - 从[Apache JMeter官网](https://jmeter.apache.org/download_jmeter.cgi)下载
   - 解压缩到本地目录
   - 启动：运行`bin/jmeter.bat`

## 创建JMeter测试计划

### 基本设置

1. **创建线程组**
   - 右键点击"Test Plan" > "Add" > "Threads (Users)" > "Thread Group"
   - 设置参数：
     - 线程数(Number of Threads): 50
     - 爬升周期(Ramp-up Period): 30（秒）
     - 循环次数(Loop Count): 10

2. **添加CSV数据集**
   - 右键点击"Thread Group" > "Add" > "Config Element" > "CSV Data Set Config"
   - 设置参数：
     - 文件名(Filename): `F:\project\ichat\test_prompts.csv`
     - 变量名(Variable Names): `prompt`
     - 分隔符(Delimiter): `,`
     - 允许引用(Allow quoted data): 勾选
     - 共享模式(Sharing mode): "All threads"

### 配置HTTP请求

1. **添加HTTP请求默认值**
   - 右键点击"Thread Group" > "Add" > "Config Element" > "HTTP Request Defaults"
   - 设置参数：
     - 服务器名称或IP(Server Name or IP): `10.10.15.210`
     - 端口号(Port Number): `5000`
     - 协议(Protocol): `http`
     - 连接超时(Connect Timeout): `600000`
     - 响应超时(Response Timeout): `600000`

2. **添加HTTP请求**
   - 右键点击"Thread Group" > "Add" > "Sampler" > "HTTP Request"
   - 设置参数：
     - 方法(Method): `POST`
     - 路径(Path): `/api/chat`
     - 内容编码(Content encoding): `UTF-8`
     - 请求体数据(Body Data):
       ```json
       {
         "prompt": "${prompt}"
       }
       ```

3. **添加HTTP头管理器**
   - 右键点击"HTTP Request" > "Add" > "Config Element" > "HTTP Header Manager"
   - 添加头信息:
     - `Content-Type`: `application/json`
     - `Accept`: `application/json`

### 添加结果处理和监听器

1. **添加正则提取器处理响应中的<深度思考>标签**
   - 右键点击"HTTP Request" > "Add" > "Post Processors" > "Regular Expression Extractor"
   - 设置参数：
     - 引用名称(Reference Name): `original_response`
     - 正则表达式(Regular Expression): `"response":"(.*?)"`
     - 模板(Template): `$1$`
     - 匹配编号(Match No.): `1`

2. **添加JSR223后处理器处理响应**
   - 右键点击"HTTP Request" > "Add" > "Post Processors" > "JSR223 PostProcessor"
   - 语言(Language): `groovy`
   - 脚本(Script):
     ```groovy
     // 获取原始响应
     def originalResponse = vars.get("original_response");
     if (originalResponse) {
         // 移除<深度思考>标签及其内容
         def cleanedResponse = originalResponse.replaceAll(/<深度思考>[\\s\\S]*?<\\/深度思考>/g, "");
         
         // 格式化响应，去除多余空行
         cleanedResponse = cleanedResponse.replaceAll(/\n{3,}/g, "\n\n").trim();
         
         // 保存处理后的响应
         vars.put("processed_response", cleanedResponse);
         
         // 记录日志
         log.info("原始响应长度: " + originalResponse.length());
         log.info("处理后响应长度: " + cleanedResponse.length());
     }
     ```

3. **添加结果报告监听器**
   - 聚合报告：右键点击"Thread Group" > "Add" > "Listener" > "Aggregate Report"
   - 图形结果：右键点击"Thread Group" > "Add" > "Listener" > "Graph Results"
   - 查看结果树：右键点击"Thread Group" > "Add" > "Listener" > "View Results Tree"
   
## 测试执行

### 不同测试场景配置

1. **轻量测试**
   - 线程数: 10
   - 爬升周期: 10秒
   - 持续时间: 2分钟

2. **中等负载**
   - 线程数: 30
   - 爬升周期: 20秒
   - 持续时间: 5分钟

3. **高峰负载**
   - 线程数: 50
   - 爬升周期: 30秒
   - 持续时间: 10分钟

4. **持续负载**
   - 线程数: 20
   - 爬升周期: 5秒
   - 持续时间: 30分钟

### 执行测试

1. 保存测试计划为 `F:\project\ichat\chat_api_test_plan.jmx`
2. 点击工具栏中的运行按钮(绿色三角形)开始测试
3. 观察结果指标

### 分析关注指标

1. **响应时间**
   - 平均响应时间
   - 90%响应时间
   - 95%响应时间
   - 99%响应时间

2. **吞吐量**
   - 每秒请求数(Throughput)
   - 每秒错误数

3. **错误率**
   - 总错误百分比
   - 错误类型分布

4. **服务器资源使用**
   - CPU使用率
   - 内存使用
   - 网络流量

## 测试结果验证

使用以下Python脚本验证API响应质量：

```python
import json
import requests
import random
import time
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
                cleaned_response = api_response["response"].replace(
                    /<深度思考>[\s\S]*?<\/深度思考>/g, ""
                ).replace(/\n{3,}/g, "\n\n").strip()
                
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
```

保存为 `verify_api_responses.py` 并在压力测试完成后运行，检查API响应质量。
