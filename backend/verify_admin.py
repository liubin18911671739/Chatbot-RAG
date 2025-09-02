#!/usr/bin/env python3
"""
验证测试管理员用户
"""

import sqlite3
import os

def verify_admin_user():
    """验证管理员用户是否已创建"""
    
    db_path = "instance/test_admin.db"
    
    if not os.path.exists(db_path):
        print(f"❌ 数据库文件不存在: {db_path}")
        return False
    
    try:
        # 连接数据库
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 查询用户表
        cursor.execute("SELECT id, username, email FROM users WHERE username = ?", ('admin',))
        user = cursor.fetchone()
        
        if user:
            print(f"✅ 找到管理员用户:")
            print(f"  ID: {user[0]}")
            print(f"  用户名: {user[1]}")
            print(f"  邮箱: {user[2]}")
            
            # 查询所有用户
            cursor.execute("SELECT id, username, email FROM users")
            all_users = cursor.fetchall()
            
            print(f"\n📊 数据库中共有 {len(all_users)} 个用户:")
            for user in all_users:
                print(f"  - ID: {user[0]}, 用户名: {user[1]}, 邮箱: {user[2]}")
            
            conn.close()
            return True
        else:
            print("❌ 未找到管理员用户")
            conn.close()
            return False
            
    except Exception as e:
        print(f"❌ 数据库查询失败: {str(e)}")
        return False

if __name__ == '__main__':
    print("验证测试管理员用户...")
    success = verify_admin_user()
    if success:
        print("\n✅ 验证成功！管理员用户已正确创建。")
    else:
        print("\n❌ 验证失败！")