from flask import Blueprint, jsonify, request, current_app
from app.models.news import NewsDocument
from app.models import db, Website, User  # 移除News导入
from app.utils.text_processor import process_text
from app.utils.vector_store import VectorStore
import json
from bson import ObjectId
from datetime import datetime

api_bp = Blueprint('api', __name__)

@api_bp.route('/news_create', methods=['POST'])
def create_news():
    data = request.get_json()
    if not data:
        return jsonify({
            'status': 'error',
            'message': 'No data provided'
        }), 400
        
    required_fields = ['title', 'content']
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return jsonify({
            'status': 'error',
            'message': f"Missing required fields: {', '.join(missing_fields)}"
        }), 400

    # 准备保存到MongoDB的数据
    news_data = {
        'title': data.get('title'),
        'content': data.get('content'),
        'language': data.get('language', 'en'),
        'published_date': datetime.utcnow(),
        'source': data.get('source'),
        'url': data.get('url'),
        'country': data.get('country'),
        'summary': data.get('summary')
    }
    
    # 保存到MongoDB
    news_id = NewsDocument.save(news_data)
    
    # 获取保存后的文档并转换为字典
    saved_news = NewsDocument.get_by_id(news_id)
    news_dict = NewsDocument.to_dict(saved_news)

    return jsonify({
        'status': 'success',
        'data': news_dict
    }), 201

@api_bp.route('/news', methods=['GET'])
def get_news():
    """获取新闻文章列表，支持分页和语言过滤"""
    try:
        # 获取并验证查询参数
        page = request.args.get('page', 1, type=int)
        if page < 1:
            page = 1
            
        per_page = request.args.get('per_page', 10, type=int)
        if per_page < 1 or per_page > 100:  # 设置合理的上限
            per_page = 10
            
        language = request.args.get('language')
        
        # 构建查询
        query = {}
        if language:
            query['language'] = language

        # 计算总数
        total = NewsDocument.count(query)
        
        # 计算总页数
        total_pages = (total + per_page - 1) // per_page
        
        # 计算跳过的数量
        skip = (page - 1) * per_page
        
        # 执行查询
        news_list = NewsDocument.find(
            query=query, 
            sort=[('published_date', -1)],  # 降序排序
            skip=skip,
            limit=per_page
        )
        
        # 格式化响应数据
        news_dict_list = [NewsDocument.to_dict(news) for news in news_list]
        
        return jsonify({
            'status': 'success',
            'data': news_dict_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': total_pages
            }
        })
    except Exception as e:
        # 记录错误并返回友好的错误响应
        current_app.logger.error(f"获取新闻列表失败: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': '获取新闻列表时发生错误'
        }), 500

@api_bp.route('/search/simple', methods=['GET'])
def simple_search():
    keyword = request.args.get('keyword')
    # 使用MongoDB的文本搜索
    query = {"$text": {"$search": keyword}}
    results = NewsDocument.find(query)
    return jsonify([NewsDocument.to_dict(news) for news in results])

@api_bp.route('/search/semantic', methods=['POST'])
def semantic_search():
    data = request.json
    threshold = data.get('threshold', 0.7)
    query_vector = VectorStore.encode(data.get('query'))
    results = VectorStore.search(query_vector, threshold)
    return jsonify(results)

@api_bp.route('/news/<news_id>', methods=['GET'])
def get_news_by_id(news_id):
    news = NewsDocument.get_by_id(news_id)
    if news:
        return jsonify(NewsDocument.to_dict(news))
    return jsonify({'error': 'News not found'}), 404

@api_bp.route('/news/<news_id>', methods=['DELETE'])
def delete_news(news_id):
    result = NewsDocument.delete(news_id)
    if result.deleted_count > 0:
        return jsonify({'message': 'News deleted successfully'}), 204
    return jsonify({'error': 'News not found'}), 404

@api_bp.route('/crawler/status', methods=['GET'])
def get_crawler_status():
    return jsonify({'status': 'running'})

@api_bp.route('/crawler/run', methods=['POST'])
def run_crawler():
    return jsonify({'message': 'Crawler started'}), 202

@api_bp.route('/status')
def status():
    return jsonify({'status': 'ok', 'message': 'API is running'})

@api_bp.route('/news/process', methods=['POST'])
def process_news_text():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400
    
    text = data.get('text')
    language = data.get('language')
    processed_data = process_text(text, language)

    return jsonify({
        'status': 'success',
        'data': processed_data
    })

def test_get_news_pagination(client):
    """测试获取新闻列表的分页功能"""
    # 创建测试数据
    for i in range(15):  # 创建15条测试新闻
        news = News(
            title=f"Test News {i}",
            content=f"Content {i}",
            language="en" if i % 2 == 0 else "zh"
        )
        db.session.add(news)
    db.session.commit()
    
    # 测试默认分页 (第1页，每页10条)
    response = client.get('/api/news')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'
    assert len(data['data']) == 10  # 默认每页10条
    assert data['pagination']['page'] == 1
    assert data['pagination']['total'] == 15
    
    # 测试自定义分页参数
    response = client.get('/api/news?page=2&per_page=5')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data['data']) == 5
    assert data['pagination']['page'] == 2
    assert data['pagination']['per_page'] == 5
    
    # 测试超出范围的页码
    response = client.get('/api/news?page=100')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data['data']) == 0  # 返回空列表
    
    # 测试非法页码
    response = client.get('/api/news?page=-1')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['pagination']['page'] == 1  # 应当默认为第1页

def test_get_news_language_filter(client):
    """测试获取新闻列表的语言筛选功能"""
    # 创建测试数据
    for i in range(10):
        news = News(
            title=f"Test News {i}",
            content=f"Content {i}",
            language="en" if i % 2 == 0 else "zh"
        )
        db.session.add(news)
    db.session.commit()
    
    # 测试英文筛选
    response = client.get('/api/news?language=en')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert all(item['language'] == 'en' for item in data['data'])
    
    # 测试中文筛选
    response = client.get('/api/news?language=zh')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert all(item['language'] == 'zh' for item in data['data'])
    
    # 测试不存在的语言
    response = client.get('/api/news?language=fr')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data['data']) == 0

def test_get_news_exception_handling(client, monkeypatch):
    """测试获取新闻列表的异常处理"""
    # 模拟数据库查询异常
    def mock_paginate(*args, **kwargs):
        raise Exception("Database error")
        
    # 应用mock
    monkeypatch.setattr(News.query, "paginate", mock_paginate)
    
    # 测试异常处理
    response = client.get('/api/news')
    assert response.status_code == 500
    data = json.loads(response.data)
    assert data['status'] == 'error'
    assert '获取新闻列表时发生错误' in data['message']

def test_get_news_ordering(client):
    """测试获取新闻列表的排序功能"""
    from datetime import datetime, timedelta
    
    # 创建发布日期不同的测试数据
    for i in range(5):
        news = News(
            title=f"Test News {i}",
            content=f"Content {i}",
            language="en",
            published_date=datetime.utcnow() - timedelta(days=i)
        )
        db.session.add(news)
    db.session.commit()
    
    # 验证结果按发布日期降序排列
    response = client.get('/api/news')
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # 检查排序是否正确
    dates = [item['published_date'] for item in data['data']]
    # 确保日期是降序的(较新的在前)
    assert dates == sorted(dates, reverse=True)

