from flask import Blueprint, request, jsonify, current_app
from app.models.news import News
from app.utils.vector_store import VectorStore
from app.utils.text_processor import TextProcessor
from app.utils.search_utils import search_articles, format_search_results
from app import db
import numpy as np

search_bp = Blueprint('search', __name__, url_prefix='/search')

@search_bp.route('/simple', methods=['POST'])
def simple_search():
    """
    简单搜索API端点
    接受 query 和 country 参数，返回匹配的新闻文章
    """
    # 获取请求数据
    data = request.json
    
    if not data:
        return jsonify({"error": "未提供搜索参数"}), 400
    
    query = data.get('query', '')
    country = data.get('country')
    
    # 记录搜索请求
    print(f"收到搜索请求: query={query}, country={country}")
    
    try:
        # 先实现一个模拟版本，返回测试数据
        # 在实际项目中，应该连接到数据库进行查询
        results = get_mock_search_results(query, country)
        
        return jsonify(results)
    except Exception as e:
        print(f"搜索过程中出错: {str(e)}")
        return jsonify({"error": str(e)}), 500

def get_mock_search_results(query, country=None):
    """
    生成模拟搜索结果，用于开发测试
    """
    # 模拟数据
    all_articles = [
        {
            "id": 1,
            "title": "中国经济发展报告",
            "content": "中国经济持续稳定发展，预计今年GDP增长将超过5.5%。各项经济指标表现良好，特别是在科技创新和绿色发展方面取得了显著进展。",
            "source": "新华网",
            "country": "china",
            "date": "2025-03-23"
        },
        {
            "id": 2,
            "title": "全球贸易最新动态",
            "content": "全球贸易形势复杂多变，中国与东盟贸易额持续增长，已成为最重要的贸易伙伴。同时，中欧、中美贸易也呈现新的发展态势。",
            "source": "环球时报",
            "country": "china",
            "date": "2025-03-22"
        },
        {
            "id": 3,
            "title": "美国经济政策调整",
            "content": "美国联邦储备委员会宣布新的经济政策，将对通胀和就业市场产生重要影响。分析人士认为这将促进经济增长。",
            "source": "纽约时报",
            "country": "usa",
            "date": "2025-03-21"
        },
        {
            "id": 4,
            "title": "欧盟绿色发展计划进展",
            "content": "欧盟绿色发展计划取得重要进展，多国承诺加大可再生能源投入。此举将促进欧洲经济转型和可持续发展。",
            "source": "欧洲时报",
            "country": "eu",
            "date": "2025-03-20"
        }
    ]
    
    # 简单过滤结果
    results = []
    
    # 如果没有查询词，返回所有文章（但仍然按国家过滤）
    if not query:
        results = all_articles
    else:
        # 简单文本匹配
        for article in all_articles:
            if query.lower() in article['title'].lower() or query.lower() in article['content'].lower():
                results.append(article)
    
    # 按国家过滤
    if country:
        results = [article for article in results if article['country'] == country]
    
    # 构建响应
    response = {
        "results": results,
        "total": len(results)
    }
    
    return response

@search_bp.route('/basic', methods=['GET'])
def basic_search():
    keyword = request.args.get('keyword')
    country = request.args.get('country', None)
    
    if not keyword:
        return jsonify({
            'status': 'error',
            'message': '请提供搜索关键词'
        }), 400
    
    try:
        # 在开发阶段使用模拟数据
        mock_results = get_mock_search_results(keyword, country)
        return jsonify({
            'status': 'success',
            'query': keyword,
            'country': country,
            'results': mock_results['results'],
            'total': mock_results['total']
        })
        
        # 实际数据库查询代码在这里，目前注释掉
        # results = News.query.filter(News.title.contains(keyword))
        # if country:
        #     results = results.filter(News.country == country)
        # return jsonify([result.to_dict() for result in results.all()])
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'搜索过程中出错: {str(e)}'
        }), 500

@search_bp.route('/semantic', methods=['GET', 'POST'])
def semantic_search():
    try:
        # 根据请求方法获取参数
        if request.method == 'GET':
            keyword = request.args.get('keyword') or request.args.get('query')
            threshold = float(request.args.get('threshold', 0.7))
            country = request.args.get('country')
        else:  # POST
            data = request.json
            if not data:
                return jsonify({
                    'status': 'error',
                    'message': '未提供搜索参数'
                }), 400
            keyword = data.get('keyword') or data.get('query')
            threshold = data.get('threshold', 0.7)
            country = data.get('country')
        
        if not keyword:
            return jsonify({
                'status': 'error',
                'message': '缺少查询关键词'
            }), 400
            
        # 使用模拟数据进行测试
        mock_results = get_mock_search_results(keyword, country)
        
        return jsonify({
            'status': 'success',
            'message': '注意：当前使用模拟数据',
            'query': keyword,
            'country': country,
            'count': mock_results['total'],
            'results': mock_results['results']
        })
        
    except Exception as e:
        current_app.logger.error(f"语义搜索出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'语义搜索过程中发生错误: {str(e)}'
        }), 500

@search_bp.route('/report', methods=['POST'])
def generate_report():
    data = request.json
    keyword = data.get('keyword')
    
    # Logic to generate a report based on the keyword
    report = generate_comprehensive_report(keyword)
    
    return jsonify(report)

def generate_comprehensive_report(keyword):
    # Placeholder for report generation logic
    return {
        "title": f"Report for {keyword}",
        "content": "This is a generated report based on the keyword."
    }

def setup_search_routes(api):
    @api.route('/text', methods=['GET'])
    def text_search():
        """基于文本的简单搜索"""
        query = request.args.get('q', '')
        if not query:
            return jsonify({'error': 'No query provided'}), 400
            
        # 清理和处理查询文本
        query = TextProcessor.clean_text(query)
        
        # 执行搜索
        results = News.query.filter(
            News.title.ilike(f'%{query}%') | 
            News.content.ilike(f'%{query}%')
        ).order_by(News.published_date.desc()).limit(20).all()
        
        return jsonify({
            'status': 'success',
            'query': query,
            'count': len(results),
            'results': [news.to_dict() for news in results]
        })
    
    # 其他路由...
    
    # @api.route('/search/semantic', methods=['POST'])  # 这个应该被注释掉
    # def semantic_search():
    #     # 代码...

    @api.route('/advanced', methods=['POST'])
    def advanced_search():
        """高级搜索：组合多种条件"""
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No search criteria provided'}), 400
        
        # 构建查询
        query = News.query
        
        # 应用各种过滤条件
        if 'keywords' in data and data['keywords']:
            keywords = data['keywords']
            conditions = []
            for keyword in keywords:
                conditions.append(News.title.ilike(f'%{keyword}%'))
                conditions.append(News.content.ilike(f'%{keyword}%'))
            
            if conditions:
                query = query.filter(db.or_(*conditions))
        
        if 'date_from' in data and data['date_from']:
            query = query.filter(News.published_date >= data['date_from'])
            
        if 'date_to' in data and data['date_to']:
            query = query.filter(News.published_date <= data['date_to'])
            
        if 'language' in data and data['language']:
            query = query.filter(News.language == data['language'])
            
        if 'source' in data and data['source']:
            query = query.filter(News.source == data['source'])
        
        # 执行查询
        limit = data.get('limit', 20)
        results = query.order_by(News.published_date.desc()).limit(limit).all()
        
        return jsonify({
            'status': 'success',
            'count': len(results),
            'results': [news.to_dict() for news in results]
        })

# 如果需要，可以在这里添加更多的搜索相关函数