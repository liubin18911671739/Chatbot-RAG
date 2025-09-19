#!/usr/bin/env python3
"""
搜索分析功能数据库迁移脚本

创建搜索分析和关键词统计表
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask
from models.database import db, SearchAnalytics, SearchKeywords

def create_app():
    """创建Flask应用实例"""
    app = Flask(__name__)

    # 读取数据库配置
    database_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{database_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    return app

def upgrade():
    """创建搜索分析相关表"""
    app = create_app()

    with app.app_context():
        try:
            # 创建新表
            db.create_all()

            print("✅ 搜索分析表创建成功:")
            print("  - search_analytics (搜索分析记录表)")
            print("  - search_keywords (关键词统计表)")

        except Exception as e:
            print(f"❌ 数据库迁移失败: {e}")
            return False

    return True

def downgrade():
    """删除搜索分析相关表 (谨慎使用)"""
    app = create_app()

    with app.app_context():
        try:
            # 删除表
            SearchAnalytics.__table__.drop(db.engine)
            SearchKeywords.__table__.drop(db.engine)

            print("⚠️  搜索分析表已删除:")
            print("  - search_analytics")
            print("  - search_keywords")

        except Exception as e:
            print(f"❌ 删除表失败: {e}")
            return False

    return True

def check_tables():
    """检查表是否存在"""
    app = create_app()

    with app.app_context():
        try:
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()

            print("📋 当前数据库表:")
            for table in tables:
                print(f"  - {table}")

            if 'search_analytics' in tables and 'search_keywords' in tables:
                print("✅ 搜索分析表已存在")
                return True
            else:
                print("❌ 搜索分析表不存在")
                return False

        except Exception as e:
            print(f"❌ 检查表失败: {e}")
            return False

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='搜索分析功能数据库迁移')
    parser.add_argument('action', choices=['upgrade', 'downgrade', 'check'],
                       help='执行的操作: upgrade(创建表), downgrade(删除表), check(检查表)')

    args = parser.parse_args()

    print(f"🚀 执行数据库迁移: {args.action}")

    if args.action == 'upgrade':
        success = upgrade()
        sys.exit(0 if success else 1)
    elif args.action == 'downgrade':
        confirm = input("⚠️  确定要删除搜索分析表吗? 这将丢失所有数据! (yes/no): ")
        if confirm.lower() == 'yes':
            success = downgrade()
            sys.exit(0 if success else 1)
        else:
            print("取消操作")
            sys.exit(0)
    elif args.action == 'check':
        check_tables()
        sys.exit(0)