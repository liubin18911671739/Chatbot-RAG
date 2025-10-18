#!/usr/bin/env python3
"""
数据库迁移管理脚本

用法:
    python manage_db.py init       # 初始化迁移环境
    python manage_db.py migrate    # 生成迁移脚本
    python manage_db.py upgrade    # 应用迁移
    python manage_db.py downgrade  # 回滚迁移
    python manage_db.py current    # 查看当前版本
    python manage_db.py history    # 查看迁移历史
"""

import os
import sys
from flask_migrate import init, migrate, upgrade, downgrade, current, history

# 导入 app 和 db
from app import app, db

def run_command(command, message=None):
    """运行迁移命令"""
    if message:
        print(f"{'='*60}")
        print(f"  {message}")
        print(f"{'='*60}")

    try:
        with app.app_context():
            if command == 'init':
                init()
                print("\n✅ 迁移环境初始化成功！")
                print("   migrations/ 目录已创建")

            elif command == 'migrate':
                msg = input("请输入迁移说明（留空使用默认值）: ").strip()
                if not msg:
                    msg = "自动生成的迁移"
                migrate(message=msg)
                print(f"\n✅ 迁移脚本生成成功：{msg}")
                print("   请检查 migrations/versions/ 中的迁移文件")

            elif command == 'upgrade':
                upgrade()
                print("\n✅ 数据库迁移应用成功！")

            elif command == 'downgrade':
                revision = input("回滚到哪个版本？（留空回滚一步，-1 回滚到上一版本）: ").strip()
                if not revision:
                    revision = '-1'
                downgrade(revision=revision)
                print(f"\n✅ 数据库回滚成功到版本：{revision}")

            elif command == 'current':
                current()

            elif command == 'history':
                history()

            else:
                print(f"❌ 未知命令：{command}")
                print_help()
                return False

        return True

    except Exception as e:
        print(f"\n❌ 执行失败：{str(e)}")
        import traceback
        traceback.print_exc()
        return False


def print_help():
    """打印帮助信息"""
    print(__doc__)


def main():
    """主函数"""
    if len(sys.argv) < 2:
        print_help()
        return

    command = sys.argv[1].lower()

    # 命令映射
    commands = {
        'init': '初始化数据库迁移环境',
        'migrate': '生成新的迁移脚本',
        'upgrade': '应用数据库迁移',
        'downgrade': '回滚数据库迁移',
        'current': '显示当前数据库版本',
        'history': '显示迁移历史',
        'help': '显示帮助信息',
    }

    if command == 'help' or command not in commands:
        print_help()
        return

    run_command(command, commands.get(command))


if __name__ == '__main__':
    main()
