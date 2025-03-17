from flask import Blueprint, request, jsonify
import asyncio
import os
import base64
from app.services.rag_service import RAGService

chat_bp = Blueprint('chat', __name__)
rag_service = RAGService("vector_index.faiss")

def load_sensitive_words(filename='sensitive_words.txt'):
    """
    加载敏感词列表，尝试多个可能的位置
    """
    possible_paths = [
        # 当前工作目录
        filename,
        # 相对于当前脚本的位置
        os.path.join(os.path.dirname(os.path.abspath(__file__)), filename),
        # 相对于项目根目录的位置
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), filename),
        # 配置目录
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "config", filename)
    ]
    
    for path in possible_paths:
        try:
            with open(path, 'r', encoding='utf-8') as f:
                words = f.read().splitlines()
                print(f"成功从 {path} 加载了 {len(words)} 个敏感词")
                return words
        except (FileNotFoundError, IOError):
            continue
    
    # 如果所有路径都失败，返回空列表并打印警告
    print(f"警告: 无法找到敏感词文件 '{filename}'，使用空列表代替")
    return []

# 尝试加载敏感词，如果失败则使用空列表
try:
    sensitive_words = load_sensitive_words()
except Exception as e:
    print(f"加载敏感词时出错: {str(e)}，使用空列表代替")
    sensitive_words = []

def contains_sensitive_word(prompt, sensitive_words):
    """
    检测 prompt 中是否包含敏感词。
    :param prompt: 用户输入的字符串
    :param sensitive_words: 敏感词列表
    :return: (is_sensitive, detected_words)
             is_sensitive: bool, 表示是否检测到敏感词
             detected_words: list, 包含检测到的敏感词
    """
    detected_words = []
    for word in sensitive_words:
        if word in prompt:
            detected_words.append(word)
    return len(detected_words) > 0, detected_words

@chat_bp.route('/chat', methods=['POST'])
def chat_api():
    data = request.json
    student_id = data.get('student_id', '未知用户')
    prompt = data.get('prompt', '')
    card_pinyin = data.get('card_pinyin')
    
    
    is_sensitive, detected_words = contains_sensitive_word(prompt, sensitive_words)
    if is_sensitive:
        return jsonify({
            'status': 'error',
            'message': '您的输入包含不适当的内容',
            'sensitive_words': detected_words
        })
    
    
    try:
        result = asyncio.run(rag_service.handle_user_input(
            student_id, 
            prompt.strip(), 
            sensitive_words,
            card_pinyin
        ))
        
        
        attachment_data = []
        for path in result.get('attachment_paths', []):
            if os.path.exists(path):
                with open(path, "rb") as file:
                    file_contents = file.read()
                    base64_data = base64.b64encode(file_contents).decode()
                    attachment_data.append({
                        'name': os.path.basename(path),
                        'data': base64_data
                    })
        
        result['attachment_data'] = attachment_data
        result['status'] = 'success'
        
        if 'attachment_paths' in result:
            del result['attachment_paths']
            
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'处理请求时发生错误: {str(e)}'
        })

@chat_bp.route('/scenes', methods=['GET'])
def get_scenes():
    # 返回场景
    scenes = {
        "通用助手": {
            "id": None,  
            "description": "棠心问答通用助手",
            "icon": "🎓"
        },
        "智慧思政": {
            "id": "db_zhihuisizheng",
            "description": "智能化思政教育平台",
            "icon": "💡"
        },
        "思政学习空间": {
            "id": "db_sizheng",
            "description": "思想政治教育资源",
            "icon": "📚"
        },        
        "学习指导": {
            "id": "db_xuexizhidao",
            "description": "学习方法与指导服务",
            "icon": "📖"
        },
        "科研辅助": {
            "id": "db_keyanfuzhu",
            "description": "科研工作辅助服务",
            "icon": "🔬"
        },
        "网上办事大厅": {
            "id": "db_wangshangbanshiting",
            "description": "在线办事服务平台",
            "icon": "🏢"
        }
    }
    return jsonify(scenes)

@chat_bp.route('/feedback', methods=['POST'])
def save_feedback():
    
    import sqlite3
    from datetime import datetime
    
    data = request.json
    feedback = data.get('feedback', {})
    question = data.get('question', '')
    answer = data.get('answer', '')
    scene = data.get('scene', '默认场景')
    write_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        DATABASE_FILE = os.path.join(current_dir, "data", "feedback.db")
        
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO feedback (score, text, question, answer, time, scene) 
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (feedback.get('score', ''), feedback.get('text', ''), question, answer, write_time, scene))
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@chat_bp.route('/greeting', methods=['GET'])
def get_greeting():
    from utils import show_holiday_greeting
    greeting = show_holiday_greeting()
    return jsonify({'greeting': greeting})