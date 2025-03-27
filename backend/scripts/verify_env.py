# 创建一个简单的验证脚本 verify_env.py
import sys

dependencies = [
    "sentence_transformers",
    "faiss",
    "pymongo",
    "tqdm",
    "numpy"
]

print("检查环境依赖...")
missing = []
for dep in dependencies:
    try:
        __import__(dep)
        print(f"✓ {dep} 已安装")
    except ImportError:
        missing.append(dep)
        print(f"✗ {dep} 未安装")

if missing:
    print("\n请安装缺失的依赖:")
    for dep in missing:
        print(f"pip install {dep}")
else:
    print("\n所有依赖已安装，环境准备就绪！")