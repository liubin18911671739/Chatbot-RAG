from flask import Blueprint, render_template, redirect, url_for, request, flash, session, jsonify
from functools import wraps
import hashlib
import os
from ..models.document import Document
from ..models.agent_config import AgentConfig
from ..models.conversation import Conversation
from ..utils.vector_store import VectorStore
from .. import db

admin_bp = Blueprint('admin', __name__, template_folder='templates')

# 初始化向量存储
vector_store = VectorStore()

# 登录验证装饰器
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_logged_in' not in session:
            return redirect(url_for('admin.login'))
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/')
def admin_index():
    """管理主页，直接重定向到仪表盘"""
    # 调试阶段自动重定向到仪表盘
    return redirect(url_for('admin.dashboard'))

@admin_bp.route('/login', methods=['GET', 'POST'])
def login():
    """管理员登录"""
    error = None
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        # 简单的身份验证逻辑 (生产环境下应使用更安全的方式)
        admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
        admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
        
        if username == admin_username and password == admin_password:
            session['admin_logged_in'] = True
            return redirect(url_for('admin.dashboard'))
        else:
            error = '无效的用户名或密码'
            
    return render_template('login.html', error=error)

@admin_bp.route('/logout')
def logout():
    """管理员登出"""
    session.pop('admin_logged_in', None)
    flash('您已成功登出', 'info')
    return redirect(url_for('admin.login'))

@admin_bp.route('/dashboard')
@login_required
def dashboard():
    """仪表盘页面"""
    # 获取统计数据
    stats = {
        'documents_count': Document.query.count(),
        'agents_count': AgentConfig.query.count(),
        'active_agents': AgentConfig.query.filter_by(active=True).count(),
        'conversations_today': Conversation.query.filter(
            Conversation.created_at >= db.func.date('now')
        ).count()
    }
    
    # 获取最近对话
    recent_conversations = Conversation.query.order_by(
        Conversation.updated_at.desc()
    ).limit(10).all()
    
    conversations_data = []
    for conv in recent_conversations:
        messages = conv.get_messages()
        if messages:
            user_message = next((m for m in messages if m['role'] == 'user'), None)
            ai_message = next((m for m in messages if m['role'] == 'assistant'), None)
            
            if user_message and ai_message:
                conversations_data.append({
                    'id': conv.id,
                    'user_question': user_message['content'][:100] + '...' if len(user_message['content']) > 100 else user_message['content'],
                    'ai_answer': ai_message['content'][:100] + '...' if len(ai_message['content']) > 100 else ai_message['content'],
                    'scene': conv.scene_id or '通用',
                    'time': conv.updated_at
                })
    
    return render_template('dashboard.html', stats=stats, conversations=conversations_data)

@admin_bp.route('/agent-config', methods=['GET', 'POST'])
@login_required
def agent_config():
    """智能体配置页面"""
    if request.method == 'POST':
        # 处理新增或更新智能体配置
        agent_id = request.form.get('id')
        
        agent_data = {
            'name': request.form.get('name'),
            'description': request.form.get('description', ''),
            'model': request.form.get('model', 'gpt-3.5-turbo'),
            'temperature': float(request.form.get('temperature', 0.7)),
            'max_tokens': int(request.form.get('max_tokens', 800)),
            'system_prompt': request.form.get('system_prompt', ''),
            'active': 'active' in request.form
        }
        
        # 知识库IDs需要特殊处理
        knowledge_base_ids = request.form.getlist('knowledge_base_ids')
        if knowledge_base_ids:
            import json
            agent_data['knowledge_base_ids'] = json.dumps(knowledge_base_ids)
        
        if agent_id:  # 更新现有智能体
            agent = AgentConfig.query.get(agent_id)
            if agent:
                for key, value in agent_data.items():
                    setattr(agent, key, value)
                agent.save()
                flash('智能体配置已更新', 'success')
            else:
                flash('未找到要更新的智能体', 'danger')
        else:  # 创建新智能体
            agent = AgentConfig(**agent_data)
            agent.save()
            flash('新智能体已创建', 'success')
            
        return redirect(url_for('admin.agent_config'))
        
    # 获取所有智能体配置
    agents = AgentConfig.query.all()
    
    # 获取所有文档分类作为可选的知识库
    categories = db.session.query(Document.category).distinct().all()
    categories = [c[0] for c in categories]
    
    return render_template('agent_config.html', agents=agents, categories=categories)

@admin_bp.route('/agent-config/delete/<agent_id>', methods=['POST'])
@login_required
def delete_agent(agent_id):
    """删除智能体配置"""
    agent = AgentConfig.query.get(agent_id)
    if agent:
        agent.delete()
        flash('智能体已删除', 'success')
    else:
        flash('未找到要删除的智能体', 'danger')
        
    return redirect(url_for('admin.agent_config'))

@admin_bp.route('/document-manager')
@login_required
def document_manager():
    """文档管理页面"""
    page = request.args.get('page', 1, type=int)
    category = request.args.get('category')
    
    # 分页查询文档
    query = Document.query
    if category:
        query = query.filter_by(category=category)
        
    documents = query.order_by(Document.created_at.desc()).paginate(
        page=page, per_page=20, error_out=False
    )
    
    # 获取所有文档分类
    categories = db.session.query(Document.category).distinct().all()
    categories = [c[0] for c in categories]
    
    return render_template(
        'document_manager.html', 
        documents=documents,
        categories=categories,
        current_category=category
    )

@admin_bp.route('/document-manager/upload', methods=['POST'])
@login_required
def upload_document():
    """上传文档处理"""
    if 'file' not in request.files:
        flash('没有选择文件', 'danger')
        return redirect(url_for('admin.document_manager'))
        
    file = request.files['file']
    if file.filename == '':
        flash('没有选择文件', 'danger')
        return redirect(url_for('admin.document_manager'))
        
    category = request.form.get('category', 'general')
    
    try:
        # 调用API执行上传和索引
        from ..api.rag_agent import upload_document as api_upload_document
        response = api_upload_document()
        
        data = response.get_json()
        if data.get('status') == 'success':
            flash('文档上传并索引成功', 'success')
        else:
            flash(f'文档处理失败: {data.get("message", "未知错误")}', 'danger')
    except Exception as e:
        flash(f'文档处理过程中出错: {str(e)}', 'danger')
        
    return redirect(url_for('admin.document_manager'))

@admin_bp.route('/document-manager/delete/<document_id>', methods=['POST'])
@login_required
def delete_document(document_id):
    """删除文档处理"""
    try:
        # 调用API执行删除
        from ..api.rag_agent import delete_document as api_delete_document
        response = api_delete_document(document_id)
        
        data = response.get_json()
        if data.get('status') == 'success':
            flash('文档已删除', 'success')
        else:
            flash(f'删除文档失败: {data.get("message", "未知错误")}', 'danger')
    except Exception as e:
        flash(f'删除文档过程中出错: {str(e)}', 'danger')
        
    return redirect(url_for('admin.document_manager'))

@admin_bp.route('/conversation-history')
@login_required
def conversation_history():
    """对话历史页面"""
    page = request.args.get('page', 1, type=int)
    scene_id = request.args.get('scene_id')
    
    # 分页查询对话历史
    query = Conversation.query
    if scene_id:
        query = query.filter_by(scene_id=scene_id)
        
    conversations = query.order_by(Conversation.updated_at.desc()).paginate(
        page=page, per_page=20, error_out=False
    )
    
    # 获取所有场景ID
    scenes = db.session.query(Conversation.scene_id).distinct().all()
    scenes = [s[0] for s in scenes if s[0]]
    
    return render_template(
        'conversation_history.html', 
        conversations=conversations,
        scenes=scenes,
        current_scene=scene_id
    )

@admin_bp.route('/conversation-history/<conversation_id>')
@login_required
def view_conversation(conversation_id):
    """查看单个对话详情"""
    conversation = Conversation.query.get_or_404(conversation_id)
    messages = conversation.get_messages()
    
    return render_template(
        'view_conversation.html', 
        conversation=conversation,
        messages=messages
    )

@admin_bp.route('/conversation-history/delete/<conversation_id>', methods=['POST'])
@login_required
def delete_conversation(conversation_id):
    """删除对话"""
    conversation = Conversation.query.get(conversation_id)
    if conversation:
        conversation.delete()
        flash('对话已删除', 'success')
    else:
        flash('未找到要删除的对话', 'danger')
        
    return redirect(url_for('admin.conversation_history'))

@admin_bp.route('/system-settings', methods=['GET', 'POST'])
@login_required
def system_settings():
    """系统设置页面"""
    if request.method == 'POST':
        # 更新系统设置
        # 这里可以处理各种系统配置，如API密钥、默认模型等
        flash('系统设置已更新', 'success')
        return redirect(url_for('admin.system_settings'))
        
    # 这里可以获取当前系统设置
    settings = {
        'openai_api_key': os.environ.get('OPENAI_API_KEY', ''),
        'default_model': os.environ.get('DEFAULT_MODEL', 'gpt-3.5-turbo'),
        'default_temperature': float(os.environ.get('DEFAULT_TEMPERATURE', 0.7)),
        'max_tokens': int(os.environ.get('MAX_TOKENS', 1000)),
    }
    
    return render_template('system_settings.html', settings=settings)