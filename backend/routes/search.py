from flask import request, jsonify
from routes import bp
import requests

# 目标API基础URL
TARGET_API_URL = "http://localhost:5000/api"


def find_question_by_text(query_text):
    """
    根据问题文本查找问题 - 通过调用API获取数据
    
    参数:
    - query_text: 要搜索的问题文本
    
    返回:
    - 如果找到匹配的问题，返回问题对象
    - 如果没找到，返回 None
    """
    try:
        query_lower = query_text.lower().strip()
        
        # 调用 /api/questions API 获取问题列表
        response = requests.get(f"{TARGET_API_URL}/questions", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # 根据API返回的格式处理数据
            questions = []
            if isinstance(data, dict):
                if 'qas' in data and isinstance(data['qas'], list):
                    questions = data['qas']
                elif 'data' in data and isinstance(data['data'], list):
                    questions = data['data']
                elif 'questions' in data and isinstance(data['questions'], list):
                    questions = data['questions']
            elif isinstance(data, list):
                questions = data
            
            # 在问题列表中查找匹配的问题
            for qa in questions:
                if qa.get('question', '').lower().strip() == query_lower:
                    return qa
        
        return None
        
    except Exception as e:
        print(f"查找问题时发生错误: {str(e)}")
        return None


@bp.route('/search', methods=['GET'])
def search_question():
    """
    搜索问题API - 根据查询内容返回匹配的问题ID
    
    参数:
    - query: 搜索关键词
    
    返回格式:
    {
        "id": 1213
    }
    """
    try:
        # 获取查询参数
        query = request.args.get('query', '').strip()
        
        if not query:
            return jsonify({
                "status": "error",
                "message": "查询参数不能为空"
            }), 400
        
        print(f"搜索查询: {query}")
        
        # 使用查找函数查找问题
        found_question = find_question_by_text(query)
        
        if found_question:
            print(f"找到匹配的问题: ID={found_question['id']}")
            return jsonify({
                "id": found_question['id']
            })
        
        # 如果没有找到精确匹配，返回未找到
        print("未找到匹配的问题")
        return jsonify({
            "status": "error", 
            "message": "未找到匹配的问题"
        }), 404
        
    except Exception as e:
        print(f"搜索时发生错误: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "搜索失败"
        }), 500