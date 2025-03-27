from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
import random

# 创建新闻蓝图
news_bp = Blueprint('news', __name__, url_prefix='/news')

@news_bp.route('/', methods=['GET'])
def get_news_list():
    """获取新闻列表，支持分页和过滤"""
    try:
        # 记录请求信息
        current_app.logger.info(f"新闻列表API被访问: 参数={request.args}")
        
        # 获取分页参数
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 50)  # 限制每页最大数量
        
        # 获取过滤条件
        country = request.args.get('country')
        language = request.args.get('language')
        source = request.args.get('source')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # 暂时使用模拟数据
        articles = get_mock_articles(page, per_page, country, language, source, date_from, date_to)
        
        return jsonify({
            'status': 'success',
            'message': '注意：当前使用模拟数据',
            'page': page,
            'per_page': per_page,
            'total': articles['total'],
            'total_pages': articles['total_pages'],
            'results': articles['results']
        })
    except Exception as e:
        current_app.logger.error(f"获取新闻列表出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'获取新闻列表出错: {str(e)}'
        }), 500

@news_bp.route('/<int:news_id>', methods=['GET'])
def get_news_detail(news_id):
    """获取单个新闻详情"""
    try:
        # 记录请求信息
        current_app.logger.info(f"新闻详情API被访问: ID={news_id}")
        
        # 暂时使用模拟数据
        article = get_mock_article_by_id(news_id)
        
        if not article:
            return jsonify({
                'status': 'error',
                'message': f'找不到ID为{news_id}的新闻'
            }), 404
        
        return jsonify({
            'status': 'success',
            'message': '注意：当前使用模拟数据',
            'result': article
        })
    except Exception as e:
        current_app.logger.error(f"获取新闻详情出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'获取新闻详情出错: {str(e)}'
        }), 500

@news_bp.route('/latest', methods=['GET'])
def get_latest_news():
    """获取最新新闻"""
    try:
        # 获取限制数量
        limit = min(request.args.get('limit', 5, type=int), 20)  # 最多返回20条
        
        # 获取过滤条件
        country = request.args.get('country')
        language = request.args.get('language')
        
        # 暂时使用模拟数据
        articles = get_mock_articles(1, limit, country, language)
        
        return jsonify({
            'status': 'success',
            'message': '注意：当前使用模拟数据',
            'count': len(articles['results']),
            'results': articles['results']
        })
    except Exception as e:
        current_app.logger.error(f"获取最新新闻出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'获取最新新闻出错: {str(e)}'
        }), 500

@news_bp.route('/trending', methods=['GET'])
def get_trending_news():
    """获取热门新闻"""
    try:
        # 获取限制数量
        limit = min(request.args.get('limit', 5, type=int), 20)
        
        # 获取过滤条件
        country = request.args.get('country')
        period = request.args.get('period', 'day')  # day, week, month
        
        # 暂时使用模拟数据
        trending_articles = get_mock_trending_articles(limit, country, period)
        
        return jsonify({
            'status': 'success',
            'message': '注意：当前使用模拟数据',
            'period': period,
            'count': len(trending_articles),
            'results': trending_articles
        })
    except Exception as e:
        current_app.logger.error(f"获取热门新闻出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'获取热门新闻出错: {str(e)}'
        }), 500

@news_bp.route('/sources', methods=['GET'])
def get_news_sources():
    """获取新闻来源列表"""
    try:
        # 暂时使用模拟数据
        sources = get_mock_sources()
        
        return jsonify({
            'status': 'success',
            'message': '注意：当前使用模拟数据',
            'count': len(sources),
            'results': sources
        })
    except Exception as e:
        current_app.logger.error(f"获取新闻来源出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'获取新闻来源出错: {str(e)}'
        }), 500

@news_bp.route('/countries', methods=['GET'])
def get_news_countries():
    """获取国家列表"""
    try:
        # 暂时使用模拟数据
        countries = get_mock_countries()
        
        return jsonify({
            'status': 'success',
            'message': '注意：当前使用模拟数据',
            'count': len(countries),
            'results': countries
        })
    except Exception as e:
        current_app.logger.error(f"获取国家列表出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'获取国家列表出错: {str(e)}'
        }), 500

@news_bp.route('/statistics', methods=['GET'])
def get_news_statistics():
    """获取新闻统计信息"""
    try:
        # 获取时间范围
        period = request.args.get('period', 'week')  # day, week, month, year
        
        # 暂时使用模拟数据
        statistics = get_mock_statistics(period)
        
        return jsonify({
            'status': 'success',
            'message': '注意：当前使用模拟数据',
            'period': period,
            'results': statistics
        })
    except Exception as e:
        current_app.logger.error(f"获取新闻统计出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'获取新闻统计出错: {str(e)}'
        }), 500

# 辅助函数 - 生成模拟数据
def get_mock_articles(page=1, per_page=10, country=None, language=None, source=None, date_from=None, date_to=None):
    """生成模拟新闻文章数据"""
    # 基础模拟数据
    all_articles = [
        {
            "id": 1,
            "title": "中国经济发展报告",
            "content": "中国经济持续稳定发展，预计今年GDP增长将超过5.5%。各项经济指标表现良好，特别是在科技创新和绿色发展方面取得了显著进展。",
            "summary": "中国经济持续稳定发展，GDP增长超预期。",
            "source": "新华网",
            "url": "https://example.com/news/1",
            "country": "china",
            "language": "zh",
            "published_date": "2025-03-23 08:30:00",
            "created_at": "2025-03-23 09:15:00",
            "view_count": 12500,
            "categories": ["经济", "国内"]
        },
        {
            "id": 2,
            "title": "全球贸易最新动态",
            "content": "全球贸易形势复杂多变，中国与东盟贸易额持续增长，已成为最重要的贸易伙伴。同时，中欧、中美贸易也呈现新的发展态势。",
            "summary": "中国与东盟贸易额持续增长，成为重要伙伴。",
            "source": "环球时报",
            "url": "https://example.com/news/2",
            "country": "china",
            "language": "zh",
            "published_date": "2025-03-22 14:20:00",
            "created_at": "2025-03-22 15:10:00",
            "view_count": 9800,
            "categories": ["经济", "国际", "贸易"]
        },
        {
            "id": 3,
            "title": "US Economic Policy Changes",
            "content": "The Federal Reserve announced new economic policies that will have a significant impact on inflation and the job market. Analysts believe this will stimulate economic growth.",
            "summary": "Fed announces new economic policies to stimulate growth.",
            "source": "New York Times",
            "url": "https://example.com/news/3",
            "country": "usa",
            "language": "en",
            "published_date": "2025-03-21 10:45:00",
            "created_at": "2025-03-21 11:30:00",
            "view_count": 15300,
            "categories": ["Economy", "US Politics"]
        },
        {
            "id": 4,
            "title": "EU Green Development Progress",
            "content": "The EU's green development plan has made significant progress, with multiple countries committed to increasing investment in renewable energy. This will promote Europe's economic transformation and sustainable development.",
            "summary": "EU countries increase investment in renewable energy.",
            "source": "European Times",
            "url": "https://example.com/news/4",
            "country": "eu",
            "language": "en",
            "published_date": "2025-03-20 09:15:00",
            "created_at": "2025-03-20 10:20:00",
            "view_count": 8700,
            "categories": ["Environment", "Economy", "EU Politics"]
        },
        {
            "id": 5,
            "title": "Développement technologique en France",
            "content": "La France annonce un nouveau plan pour le développement technologique, avec un accent particulier sur l'intelligence artificielle et la robotique. Le gouvernement prévoit d'investir 5 milliards d'euros dans ces secteurs.",
            "summary": "La France investit 5 milliards d'euros dans l'IA et la robotique.",
            "source": "Le Monde",
            "url": "https://example.com/news/5",
            "country": "france",
            "language": "fr",
            "published_date": "2025-03-19 11:20:00",
            "created_at": "2025-03-19 12:15:00",
            "view_count": 7200,
            "categories": ["Technologie", "Économie", "Politique"]
        },
        {
            "id": 6,
            "title": "中国科技创新成果展示",
            "content": "近年来，中国在人工智能、量子计算和航天科技等领域取得了一系列重大突破。这些创新成果正在加速应用到各行各业，推动经济社会高质量发展。",
            "summary": "中国科技创新成果在多领域取得突破，加速应用落地。",
            "source": "人民日报",
            "url": "https://example.com/news/6",
            "country": "china",
            "language": "zh",
            "published_date": "2025-03-18 09:45:00",
            "created_at": "2025-03-18 10:30:00",
            "view_count": 13800,
            "categories": ["科技", "创新", "国内"]
        },
        {
            "id": 7,
            "title": "Japanese Economic Recovery Plan",
            "content": "The Japanese government has unveiled a comprehensive economic recovery plan focusing on digital transformation and green technology. The plan aims to boost Japan's GDP by 2% over the next fiscal year.",
            "summary": "Japan unveils economic recovery plan focusing on digital and green tech.",
            "source": "Nikkei Asia",
            "url": "https://example.com/news/7",
            "country": "japan",
            "language": "en",
            "published_date": "2025-03-17 08:20:00",
            "created_at": "2025-03-17 09:10:00",
            "view_count": 9500,
            "categories": ["Economy", "Asia", "Technology"]
        }
    ]
    
    # 应用过滤器
    filtered_articles = all_articles
    
    if country:
        filtered_articles = [a for a in filtered_articles if a['country'] == country]
    
    if language:
        filtered_articles = [a for a in filtered_articles if a['language'] == language]
    
    if source:
        filtered_articles = [a for a in filtered_articles if a['source'] == source]
    
    if date_from:
        try:
            from_date = datetime.strptime(date_from, '%Y-%m-%d')
            filtered_articles = [a for a in filtered_articles if datetime.strptime(a['published_date'].split()[0], '%Y-%m-%d') >= from_date]
        except ValueError:
            # 忽略无效日期
            pass
    
    if date_to:
        try:
            to_date = datetime.strptime(date_to, '%Y-%m-%d')
            filtered_articles = [a for a in filtered_articles if datetime.strptime(a['published_date'].split()[0], '%Y-%m-%d') <= to_date]
        except ValueError:
            # 忽略无效日期
            pass
    
    # 计算分页
    total = len(filtered_articles)
    total_pages = (total + per_page - 1) // per_page if total > 0 else 1
    
    # 确保页码合法
    if page < 1:
        page = 1
    elif page > total_pages and total_pages > 0:
        page = total_pages
    
    # 获取当前页的文章
    start_idx = (page - 1) * per_page
    end_idx = min(start_idx + per_page, total)
    
    current_page_articles = filtered_articles[start_idx:end_idx] if start_idx < total else []
    
    return {
        'results': current_page_articles,
        'total': total,
        'total_pages': total_pages
    }

def get_mock_article_by_id(news_id):
    """根据ID获取模拟新闻文章"""
    all_articles = get_mock_articles(per_page=100)['results']
    
    for article in all_articles:
        if article['id'] == news_id:
            # 为详情页添加额外信息
            article['related_news'] = [
                {
                    "id": a['id'],
                    "title": a['title'],
                    "source": a['source'],
                    "published_date": a['published_date']
                }
                for a in random.sample(all_articles, min(3, len(all_articles)))
                if a['id'] != news_id
            ]
            return article
    
    return None

def get_mock_trending_articles(limit=5, country=None, period='day'):
    """获取热门新闻模拟数据"""
    # 获取所有文章
    all_articles = get_mock_articles(per_page=100)['results']
    
    # 按国家过滤
    if country:
        all_articles = [a for a in all_articles if a['country'] == country]
    
    # 按照访问量排序
    sorted_articles = sorted(all_articles, key=lambda x: x.get('view_count', 0), reverse=True)
    
    # 获取指定数量
    trending = sorted_articles[:limit]
    
    # 简化返回字段
    return [
        {
            "id": a['id'],
            "title": a['title'],
            "summary": a['summary'],
            "source": a['source'],
            "country": a['country'],
            "published_date": a['published_date'],
            "view_count": a['view_count']
        }
        for a in trending
    ]

def get_mock_sources():
    """获取新闻来源模拟数据"""
    return [
        {"id": 1, "name": "新华网", "country": "china", "language": "zh", "article_count": 1250},
        {"id": 2, "name": "环球时报", "country": "china", "language": "zh", "article_count": 980},
        {"id": 3, "name": "人民日报", "country": "china", "language": "zh", "article_count": 1580},
        {"id": 4, "name": "New York Times", "country": "usa", "language": "en", "article_count": 2100},
        {"id": 5, "name": "Washington Post", "country": "usa", "language": "en", "article_count": 1850},
        {"id": 6, "name": "CNN", "country": "usa", "language": "en", "article_count": 2200},
        {"id": 7, "name": "BBC", "country": "uk", "language": "en", "article_count": 2500},
        {"id": 8, "name": "Le Monde", "country": "france", "language": "fr", "article_count": 1350},
        {"id": 9, "name": "Der Spiegel", "country": "germany", "language": "de", "article_count": 1100},
        {"id": 10, "name": "European Times", "country": "eu", "language": "en", "article_count": 950},
        {"id": 11, "name": "Nikkei Asia", "country": "japan", "language": "en", "article_count": 1050}
    ]

def get_mock_countries():
    """获取国家列表模拟数据"""
    return [
        {"code": "china", "name": "中国", "languages": ["zh"], "article_count": 3810},
        {"code": "usa", "name": "美国", "languages": ["en"], "article_count": 6150},
        {"code": "uk", "name": "英国", "languages": ["en"], "article_count": 2500},
        {"code": "france", "name": "法国", "languages": ["fr"], "article_count": 1350},
        {"code": "germany", "name": "德国", "languages": ["de"], "article_count": 1100},
        {"code": "japan", "name": "日本", "languages": ["ja", "en"], "article_count": 1050},
        {"code": "eu", "name": "欧盟", "languages": ["en", "fr", "de", "es", "it"], "article_count": 950}
    ]

def get_mock_statistics(period='week'):
    """获取新闻统计模拟数据"""
    today = datetime.now()
    
    # 根据周期计算时间范围
    if period == 'day':
        days = 1
    elif period == 'week':
        days = 7
    elif period == 'month':
        days = 30
    elif period == 'year':
        days = 365
    else:
        days = 7  # 默认一周
    
    # 生成模拟统计数据
    statistics = {
        "total_articles": 16910,
        "new_articles": 248 if period == 'day' else (1736 if period == 'week' else (7484 if period == 'month' else 16910)),
        "total_sources": 11,
        "total_countries": 7,
        "languages": {
            "en": 12750,
            "zh": 3810,
            "fr": 1350,
            "de": 1100,
            "other": 900
        },
        "top_sources": [
            {"name": "BBC", "count": 2500},
            {"name": "CNN", "count": 2200},
            {"name": "New York Times", "count": 2100},
            {"name": "Washington Post", "count": 1850},
            {"name": "人民日报", "count": 1580}
        ],
        "top_countries": [
            {"name": "美国", "count": 6150},
            {"name": "中国", "count": 3810},
            {"name": "英国", "count": 2500},
            {"name": "法国", "count": 1350},
            {"name": "德国", "count": 1100}
        ],
        "time_distribution": []
    }
    
    # 生成时间分布数据
    if period == 'day':
        # 按小时分布
        for hour in range(24):
            statistics["time_distribution"].append({
                "label": f"{hour:02d}:00",
                "count": random.randint(5, 20)
            })
    elif period in ['week', 'month']:
        # 按天分布
        days_count = 7 if period == 'week' else 30
        for i in range(days_count):
            day = today - timedelta(days=days_count-i-1)
            statistics["time_distribution"].append({
                "label": day.strftime("%Y-%m-%d"),
                "count": random.randint(200, 300) if period == 'week' else random.randint(200, 300)
            })
    else:
        # 按月分布
        for i in range(12):
            month = today.month - i
            year = today.year
            if month <= 0:
                month += 12
                year -= 1
            statistics["time_distribution"].append({
                "label": f"{year}-{month:02d}",
                "count": random.randint(1200, 1800)
            })
    
    return statistics