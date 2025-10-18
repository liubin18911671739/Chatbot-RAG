#!/usr/bin/env python3
"""
向量数据库集成 - 完整测试套件
运行所有向量数据库相关的测试
"""

import sys
import subprocess
from pathlib import Path

# 测试脚本列表
TEST_SCRIPTS = [
    {
        "name": "VectorService 核心功能测试",
        "script": "test_vector_minimal.py",
        "description": "测试 FAISS 向量存储的基础功能（不需要模型下载）",
        "required": True
    },
    {
        "name": "VectorService 单元测试",
        "command": ["python3", "-m", "pytest", "tests/test_vector_service.py", "-v", "--tb=short"],
        "description": "完整的 VectorService 单元测试套件",
        "required": True
    },
    {
        "name": "EmbeddingService 单元测试",
        "command": ["python3", "-m", "pytest", "tests/test_embedding_service.py", "-v", "--tb=short"],
        "description": "完整的 EmbeddingService 单元测试套件",
        "required": False,  # 需要下载模型
        "skip_reason": "需要下载模型（~471MB），可选运行"
    },
    {
        "name": "快速验证测试",
        "script": "test_vector_quick.py",
        "description": "快速验证向量数据库集成的基础功能",
        "required": False,  # 需要下载模型
        "skip_reason": "需要下载模型（~471MB），可选运行"
    },
    {
        "name": "完整集成测试",
        "script": "test_vector_integration.py",
        "description": "端到端集成测试，包含性能基准测试",
        "required": False,  # 需要下载模型
        "skip_reason": "需要下载模型（~471MB），可选运行"
    }
]

def run_test(test_config):
    """运行单个测试"""
    print("\n" + "=" * 70)
    print(f"测试: {test_config['name']}")
    print(f"说明: {test_config['description']}")
    
    if not test_config.get('required', True):
        print(f"⚠️  可选测试 - {test_config.get('skip_reason', '可跳过')}")
        return True, "跳过"
    
    print("=" * 70)
    
    try:
        if 'script' in test_config:
            # 运行 Python 脚本
            result = subprocess.run(
                ["python3", test_config['script']],
                capture_output=True,
                text=True,
                timeout=60
            )
        else:
            # 运行命令
            result = subprocess.run(
                test_config['command'],
                capture_output=True,
                text=True,
                timeout=300
            )
        
        if result.returncode == 0:
            print("✅ 测试通过")
            print(result.stdout)
            return True, "通过"
        else:
            print("❌ 测试失败")
            print(result.stdout)
            print(result.stderr)
            return False, "失败"
    
    except subprocess.TimeoutExpired:
        print("⏱️ 测试超时")
        return False, "超时"
    
    except FileNotFoundError as e:
        print(f"⚠️ 测试文件未找到: {e}")
        return False, "未找到"
    
    except Exception as e:
        print(f"❌ 测试执行错误: {e}")
        return False, "错误"

def main():
    """主测试流程"""
    print("=" * 70)
    print("向量数据库集成 - 完整测试套件")
    print("=" * 70)
    
    # 切换到 backend 目录
    backend_dir = Path(__file__).parent
    import os
    os.chdir(backend_dir)
    print(f"工作目录: {backend_dir}")
    
    results = []
    
    # 运行所有测试
    for test_config in TEST_SCRIPTS:
        success, status = run_test(test_config)
        results.append({
            "name": test_config["name"],
            "success": success,
            "status": status,
            "required": test_config.get("required", True)
        })
    
    # 打印总结
    print("\n" + "=" * 70)
    print("测试总结")
    print("=" * 70)
    
    total = len(results)
    passed = sum(1 for r in results if r["success"])
    required = sum(1 for r in results if r["required"])
    required_passed = sum(1 for r in results if r["required"] and r["success"])
    
    for result in results:
        status_icon = "✅" if result["success"] else "❌"
        required_mark = "🔴" if result["required"] else "⚪"
        print(f"{status_icon} {required_mark} {result['name']}: {result['status']}")
    
    print("\n" + "-" * 70)
    print(f"总计: {passed}/{total} 通过")
    print(f"必需测试: {required_passed}/{required} 通过")
    
    # 判断是否成功
    if required_passed == required:
        print("\n🎉 所有必需测试通过！向量数据库集成功能正常")
        print("\n💡 提示: 可选测试需要下载模型（~471MB），运行:")
        print("   python3 test_vector_quick.py")
        print("   python3 test_vector_integration.py")
        return 0
    else:
        print("\n❌ 部分必需测试失败，请检查错误信息")
        return 1

if __name__ == "__main__":
    sys.exit(main())
