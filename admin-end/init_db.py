from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.document import Document
from app.models.log import Log

app = create_app()

with app.app_context():
    # 删除已有表并重新创建
    db.drop_all()
    db.create_all()
    
    # 创建管理员用户
    admin = User(
        username='admin', 
        email='admin@example.com',
        is_admin=True
    )
    admin.set_password('admin')
    
    # 创建普通用户
    user1 = User(
        username='user1',
        email='user1@example.com'
    )
    user1.set_password('password')
    
    # 创建测试文档
    doc1 = Document(
        title='示例文档1',
        filename='sample1.pdf',
        file_path='/uploads/sample1.pdf',
        file_type='pdf',
        status='processed',
        category='测试分类',
        created_by=1
    )
    
    doc2 = Document(
        title='示例文档2',
        filename='sample2.docx',
        file_path='/uploads/sample2.docx',
        file_type='docx',
        status='processing',
        category='其他分类',
        created_by=1
    )
    
    # 创建测试日志
    log1 = Log(
        level='INFO',
        message='系统启动成功',
        source='system'
    )
    
    log2 = Log(
        level='ERROR',
        message='文档处理失败: 格式不支持',
        source='document_processor'
    )
    
    # 添加到数据库
    db.session.add(admin)
    db.session.add(user1)
    db.session.add(doc1)
    db.session.add(doc2)
    db.session.add(log1)
    db.session.add(log2)
    
    # 提交更改
    db.session.commit()
    
    print("数据库初始化成功!")
    print(f"管理员账号: {admin.username}, 密码: admin")
    print(f"用户账号: {user1.username}, 密码: password")