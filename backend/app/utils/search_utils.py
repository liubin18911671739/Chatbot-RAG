from app.models.news import News, NewsArticle
from app import db
from sqlalchemy import or_, and_
from flask import current_app
import datetime

def search_articles(query, country=None, language=None, date_from=None, date_to=None, source=None, limit=20, offset=0):
    """
    根据提供的参数搜索新闻文章
    
    参数:
        query (str): 搜索关键词
        country (str): 国家过滤
        language (str): 语言过滤
        date_from (str): 起始日期，格式为 YYYY-MM-DD
        date_to (str): 结束日期，格式为 YYYY-MM-DD
        source (str): 新闻来源
        limit (int): 返回结果数量限制
        offset (int): 分页偏移量
    
    返回:
        tuple: (articles, total_count) 文章列表和总数
    """
    try:
        # 构建基础查询
        search_query = News.query
        
        # 添加关键词过滤
        if query and query.strip():
            # 分割多个关键词
            keywords = [kw.strip() for kw in query.split() if kw.strip()]
            if keywords:
                keyword_filters = []
                for keyword in keywords:
                    keyword_filters.append(News.title.ilike(f'%{keyword}%'))
                    keyword_filters.append(News.content.ilike(f'%{keyword}%'))
                search_query = search_query.filter(or_(*keyword_filters))
        
        # 添加国家过滤
        if country:
            search_query = search_query.filter(News.country == country)
        
        # 添加语言过滤
        if language:
            search_query = search_query.filter(News.language == language)
        
        # 添加日期范围过滤
        if date_from:
            try:
                from_date = datetime.datetime.strptime(date_from, '%Y-%m-%d')
                search_query = search_query.filter(News.published_date >= from_date)
            except ValueError:
                current_app.logger.warning(f"Invalid date_from format: {date_from}")
        
        if date_to:
            try:
                to_date = datetime.datetime.strptime(date_to, '%Y-%m-%d')
                # 将结束日期设置为当天的结束
                to_date = to_date.replace(hour=23, minute=59, second=59)
                search_query = search_query.filter(News.published_date <= to_date)
            except ValueError:
                current_app.logger.warning(f"Invalid date_to format: {date_to}")
        
        # 添加来源过滤
        if source:
            search_query = search_query.filter(News.source == source)
        
        # 获取总数
        total_count = search_query.count()
        
        # 添加排序和分页
        articles = search_query.order_by(News.published_date.desc()).limit(limit).offset(offset).all()
        
        return articles, total_count
    
    except Exception as e:
        current_app.logger.error(f"搜索文章时出错: {str(e)}")
        return [], 0

def format_search_results(articles, include_full_content=False):
    """
    格式化搜索结果为标准响应格式
    
    参数:
        articles (list): 文章对象列表
        include_full_content (bool): 是否包含完整内容
    
    返回:
        dict: 格式化的搜索结果
    """
    results = []
    
    for article in articles:
        # 基本信息
        article_data = {
            "id": article.id,
            "title": article.title,
            "source": article.source,
            "country": article.country,
            "language": article.language,
            "published_date": article.published_date.strftime("%Y-%m-%d") if article.published_date else None,
            "url": article.url
        }
        
        # 根据参数决定是否包含完整内容
        if include_full_content:
            article_data["content"] = article.content
        else:
            # 创建内容摘要，限制为200字符
            content = article.content or ""
            article_data["content"] = content[:200] + ("..." if len(content) > 200 else "")
        
        results.append(article_data)
    
    return results

def get_search_filters():
    """
    获取搜索过滤器选项
    
    返回:
        dict: 包含可用的过滤选项
    """
    try:
        # 获取可用的国家
        countries = db.session.query(News.country).distinct().all()
        countries = [c[0] for c in countries if c[0]]
        
        # 获取可用的语言
        languages = db.session.query(News.language).distinct().all()
        languages = [l[0] for l in languages if l[0]]
        
        # 获取可用的新闻来源
        sources = db.session.query(News.source).distinct().all()
        sources = [s[0] for s in sources if s[0]]
        
        # 获取最早和最新的文章日期
        earliest_date = db.session.query(db.func.min(News.published_date)).scalar()
        latest_date = db.session.query(db.func.max(News.published_date)).scalar()
        
        date_range = {
            "earliest": earliest_date.strftime("%Y-%m-%d") if earliest_date else None,
            "latest": latest_date.strftime("%Y-%m-%d") if latest_date else None
        }
        
        return {
            "countries": countries,
            "languages": languages,
            "sources": sources,
            "date_range": date_range
        }
    
    except Exception as e:
        current_app.logger.error(f"获取搜索过滤器时出错: {str(e)}")
        return {
            "countries": [],
            "languages": [],
            "sources": [],
            "date_range": {"earliest": None, "latest": None}
        }

def get_search_statistics(timeframe="week"):
    """
    获取搜索统计数据
    
    参数:
        timeframe (str): 时间范围，可选值为 'day', 'week', 'month', 'year'
    
    返回:
        dict: 包含搜索统计数据
    """
    try:
        # 确定时间范围
        now = datetime.datetime.now()
        if timeframe == "day":
            start_date = now - datetime.timedelta(days=1)
        elif timeframe == "week":
            start_date = now - datetime.timedelta(days=7)
        elif timeframe == "month":
            start_date = now - datetime.timedelta(days=30)
        elif timeframe == "year":
            start_date = now - datetime.timedelta(days=365)
        else:
            start_date = now - datetime.timedelta(days=7)  # 默认为一周
        
        # 获取各种统计数据
        total_articles = News.query.count()
        new_articles = News.query.filter(News.published_date >= start_date).count()
        
        # 按国家统计
        country_stats = db.session.query(
            News.country, db.func.count(News.id)
        ).group_by(News.country).all()
        country_stats = {country: count for country, count in country_stats if country}
        
        # 按语言统计
        language_stats = db.session.query(
            News.language, db.func.count(News.id)
        ).group_by(News.language).all()
        language_stats = {lang: count for lang, count in language_stats if lang}
        
        # 按来源统计
        source_stats = db.session.query(
            News.source, db.func.count(News.id)
        ).group_by(News.source).all()
        source_stats = {source: count for source, count in source_stats if source}
        
        # 按日期统计
        date_stats = []
        if timeframe in ["day", "week"]:
            # 按小时统计
            for i in range(24):
                hour_start = now.replace(hour=i, minute=0, second=0, microsecond=0)
                hour_end = hour_start + datetime.timedelta(hours=1)
                count = News.query.filter(
                    News.published_date >= hour_start,
                    News.published_date < hour_end
                ).count()
                date_stats.append({
                    "label": f"{i:02d}:00",
                    "count": count
                })
        else:
            # 按日期统计
            days = 30 if timeframe == "month" else 365
            for i in range(days):
                day_start = (now - datetime.timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
                day_end = day_start + datetime.timedelta(days=1)
                count = News.query.filter(
                    News.published_date >= day_start,
                    News.published_date < day_end
                ).count()
                date_stats.append({
                    "label": day_start.strftime("%Y-%m-%d"),
                    "count": count
                })
            
            # 反转列表，使其按时间顺序排列
            date_stats.reverse()
        
        return {
            "total_articles": total_articles,
            "new_articles": new_articles,
            "country_stats": country_stats,
            "language_stats": language_stats,
            "source_stats": source_stats,
            "date_stats": date_stats,
            "timeframe": timeframe
        }
    
    except Exception as e:
        current_app.logger.error(f"获取搜索统计数据时出错: {str(e)}")
        return {
            "total_articles": 0,
            "new_articles": 0,
            "country_stats": {},
            "language_stats": {},
            "source_stats": {},
            "date_stats": [],
            "timeframe": timeframe,
            "error": str(e)
        }