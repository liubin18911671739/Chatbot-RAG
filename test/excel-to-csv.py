import pandas as pd
import os

# 打印当前工作目录
print("当前工作目录:", os.getcwd())

# 检查Excel文件是否存在
excel_path = "f:\\project\\ichat\\bisu_20250102_content_0.xlsx"
print(f"检查Excel文件 {excel_path} 是否存在:", os.path.exists(excel_path))

# 读取Excel文件
print(f"正在读取Excel文件...")
try:
    df = pd.read_excel(excel_path)
    print(f"Excel读取成功，共 {len(df)} 行数据")
    print("列名:", df.columns.tolist())
except Exception as e:
    print("Excel读取失败:", e)
    exit(1)

# 使用"问题"列作为测试提示词
if "问题" in df.columns:
    # 提取提示词列并保存为CSV
    prompts = df["问题"].dropna()
    prompts.to_csv("test_prompts.csv", index=False, header=False)
    print(f"成功提取了 {len(prompts)} 条测试数据")
    # 同时保存问题和回答，便于测试后验证
    if "回答" in df.columns:
        # 创建包含问题和标准回答的JSON文件，便于测试后比对
        df_qa = df[["问题", "回答"]].dropna()
        df_qa.to_json("test_qa_pairs.json", orient="records", force_ascii=False)
        print(f"同时保存了 {len(df_qa)} 条问答对到JSON文件，可用于测试结果验证")
else:
    print("未找到'问题'列，请检查Excel文件结构")
    print("可用的列名:", df.columns.tolist())