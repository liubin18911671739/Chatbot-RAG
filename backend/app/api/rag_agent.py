from flask import Blueprint, request, jsonify, current_app
from ..models.document import Document
from ..models.agent_config import AgentConfig
from ..models.conversation import Conversation
from ..utils.vector_store import VectorStore
from ..utils.llm_service import LLMService
from ..utils.text_processor import process_text
from datetime import datetime
import uuid
import json
import os

# 创建RAG智能体蓝图
rag_agent_bp = Blueprint('rag_agent', __name__)

# 初始化向量存储和LLM服务
vector_store = VectorStore()
llm_service = LLMService()

@rag_agent_bp.route('/chat', methods=['POST'])
def chat():
    """处理用户对话请求"""
    try:
        data = request.json
        
        if not data or 'prompt' not in data:
            return jsonify({
                'status': 'error',
                'message': '缺少提问内容'
            }), 400
            
        prompt = data.get('prompt')
        student_id = data.get('student_id', '未知用户')
        scene_id = data.get('card_pinyin')  # 兼容前端参数
        
        # 1. 检索相关文档
        relevant_docs = vector_store.search(prompt, limit=5)
        
        # 2. 构建RAG提示
        context = "\n\n".join([doc.content for doc in relevant_docs])
        rag_prompt = f"""使用以下信息来回答问题。如果无法从提供的信息中找到答案，请说明你不知道，但不要编造信息。

信息:
{context}

问题: {prompt}
"""
        
        # 3. 调用LLM生成回答
        response = llm_service.generate(rag_prompt)
        
        # 4. 记录对话历史
        chat_id = data.get('chat_id', str(uuid.uuid4()))
        conversation = Conversation.get_or_create(chat_id)
        conversation.add_message("user", prompt)
        conversation.add_message("assistant", response)
        conversation.save()
        
        # 5. 准备返回数据，包含引用来源
        sources = []
        for doc in relevant_docs:
            if doc.relevance_score > 0.7:  # 仅包含高相关性文档
                sources.append({
                    'title': doc.title,
                    'document': doc.filename,
                    'url': doc.url if hasattr(doc, 'url') else None
                })
        
        return jsonify({
            'status': 'success',
            'answer': response,
            'chat_id': chat_id,
            'sources': sources
        })
    
    except Exception as e:
        current_app.logger.error(f"聊天请求处理出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': '处理请求时发生错误'
        }), 500

@rag_agent_bp.route('/documents', methods=['GET'])
def list_documents():
    """获取已索引的文档列表"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        category = request.args.get('category')
        
        query = Document.query
        if category:
            query = query.filter_by(category=category)
            
        total = query.count()
        documents = query.paginate(page=page, per_page=per_page)
        
        return jsonify({
            'status': 'success',
            'total': total,
            'page': page,
            'per_page': per_page,
            'documents': [doc.to_dict() for doc in documents.items]
        })
    
    except Exception as e:
        current_app.logger.error(f"获取文档列表出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': '获取文档列表时发生错误'
        }), 500

@rag_agent_bp.route('/documents/upload', methods=['POST'])
def upload_document():
    """上传并索引新文档"""
    try:
        if 'file' not in request.files:
            return jsonify({
                'status': 'error',
                'message': '没有文件被上传'
            }), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'status': 'error',
                'message': '未选择文件'
            }), 400
            
        # 保存文件
        filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # 处理文件内容（提取文本、分块等）
        content = process_text(file_path)
        
        # 创建文档记录
        document = Document(
            filename=filename,
            original_name=file.filename,
            file_path=file_path,
            content=content[:1000],  # 存储预览内容
            category=request.form.get('category', 'general'),
            created_at=datetime.now()
        )
        document.save()
        
        # 将文档添加到向量存储
        vector_store.add_document(document)
        
        return jsonify({
            'status': 'success',
            'message': '文档已成功上传并索引',
            'document_id': document.id
        })
    
    except Exception as e:
        current_app.logger.error(f"上传文档出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': '上传文档时发生错误'
        }), 500

@rag_agent_bp.route('/documents/<document_id>', methods=['DELETE'])
def delete_document(document_id):
    """删除文档及其向量索引"""
    try:
        document = Document.query.get(document_id)
        if not document:
            return jsonify({
                'status': 'error',
                'message': '文档不存在'
            }), 404
            
        # 从向量存储中删除
        vector_store.delete_document(document_id)
        
        # 删除文件
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
            
        # 删除数据库记录
        document.delete()
        
        return jsonify({
            'status': 'success',
            'message': '文档已成功删除'
        })
    
    except Exception as e:
        current_app.logger.error(f"删除文档出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': '删除文档时发生错误'
        }), 500

@rag_agent_bp.route('/agents', methods=['GET'])
def list_agents():
    """获取所有智能体列表"""
    try:
        agents = AgentConfig.query.all()
        
        return jsonify({
            'status': 'success',
            'agents': [agent.to_dict() for agent in agents]
        })
    except Exception as e:
        current_app.logger.error(f"获取智能体列表出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': '获取智能体列表时发生错误'
        }), 500

@rag_agent_bp.route('/agents', methods=['POST'])
def create_agent():
    """创建新的智能体配置"""
    try:
        data = request.json
        
        if not data or 'name' not in data:
            return jsonify({
                'status': 'error',
                'message': '缺少必要参数'
            }), 400
            
        # 创建新智能体配置
        agent = AgentConfig(
            name=data.get('name'),
            description=data.get('description', ''),
            model=data.get('model', 'gpt-3.5-turbo'),
            temperature=data.get('temperature', 0.7),
            max_tokens=data.get('max_tokens', 800),
            system_prompt=data.get('system_prompt', ''),
            knowledge_base_ids=json.dumps(data.get('knowledge_base_ids', [])),
            active=data.get('active', True)
        )
        agent.save()
        
        return jsonify({
            'status': 'success',
            'message': '智能体创建成功',
            'agent': agent.to_dict()
        }), 201
    
    except Exception as e:
        current_app.logger.error(f"创建智能体出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': '创建智能体时发生错误'
        }), 500

@rag_agent_bp.route('/agents/<agent_id>', methods=['PUT'])
def update_agent(agent_id):
    """更新智能体配置"""
    try:
        agent = AgentConfig.query.get(agent_id)
        if not agent:
            return jsonify({
                'status': 'error',
                'message': '智能体不存在'
            }), 404
            
        data = request.json
        
        # 更新智能体配置
        if 'name' in data:
            agent.name = data['name']
        if 'description' in data:
            agent.description = data['description']
        if 'model' in data:
            agent.model = data['model']
        if 'temperature' in data:
            agent.temperature = data['temperature']
        if 'max_tokens' in data:
            agent.max_tokens = data['max_tokens']
        if 'system_prompt' in data:
            agent.system_prompt = data['system_prompt']
        if 'knowledge_base_ids' in data:
            agent.knowledge_base_ids = json.dumps(data['knowledge_base_ids'])
        if 'active' in data:
            agent.active = data['active']
            
        agent.save()
        
        return jsonify({
            'status': 'success',
            'message': '智能体更新成功',
            'agent': agent.to_dict()
        })
    
    except Exception as e:
        current_app.logger.error(f"更新智能体出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': '更新智能体时发生错误'
        }), 500

@rag_agent_bp.route('/scenes', methods=['GET'])
def get_scenes():
    """获取所有场景信息"""
    try:
        # 场景可能是基于特定类型的智能体或知识库
        scenes = {
            "通用场景": {
                "id": "general",
                "description": "通用知识问答",
                "icon": "🌐"
            },
            "学校场景": {
                "id": "school",
                "description": "学校相关信息咨询",
                "icon": "🏫"
            },
            "思政场景": {
                "id": "ideological",
                "description": "思想政治教育",
                "icon": "📚"
            },
            "国际关系": {
                "id": "international",
                "description": "国际关系与全球事务",
                "icon": "🌍"
            }
        }
        
        return jsonify(scenes)
    
    except Exception as e:
        current_app.logger.error(f"获取场景信息出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': '获取场景信息时发生错误'
        }), 500

@rag_agent_bp.route('/greeting', methods=['GET'])
def get_greeting():
    """获取欢迎消息"""
    try:
        greeting = "您好！我是基于RAG技术的智能助手，可以回答关于学校和各类知识的问题。请问有什么可以帮助您的吗？"
        return jsonify({
            'greeting': greeting
        })
    
    except Exception as e:
        current_app.logger.error(f"获取欢迎消息出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': '获取欢迎消息时发生错误'
        }), 500

@rag_agent_bp.route('/stats', methods=['GET'])
def get_stats():
    """获取RAG系统统计信息"""
    try:
        # 这里实际应该从数据库获取实时数据
        stats = {
            'documents': {
                'total': Document.query.count(),
                'by_category': {
                    'general': Document.query.filter_by(category='general').count(),
                    'academic': Document.query.filter_by(category='academic').count(),
                    'administration': Document.query.filter_by(category='administration').count()
                }
            },
            'conversations': {
                'total': Conversation.query.count(),
                'today': Conversation.query.filter(
                    Conversation.created_at >= datetime.now().replace(
                        hour=0, minute=0, second=0, microsecond=0
                    )
                ).count()
            },
            'agents': {
                'total': AgentConfig.query.count(),
                'active': AgentConfig.query.filter_by(active=True).count()
            },
            'performance': {
                'avg_response_time': '1.2s',
                'avg_relevance_score': '0.85'
            }
        }
        
        return jsonify({
            'status': 'success',
            'data': stats,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        current_app.logger.error(f"获取统计信息出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': '获取统计信息时发生错误'
        }), 500
