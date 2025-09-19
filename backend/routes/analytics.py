"""
搜索分析API路由

提供检索词统计和分析功能的API接口
"""

from flask import Blueprint, request, jsonify
from models.database import db, SearchAnalytics, SearchKeywords, Scene
from sqlalchemy import func, desc, text
from datetime import datetime, timedelta
import jieba
import re
from collections import Counter
import logging

# 创建蓝图
analytics_bp = Blueprint('analytics', __name__)

# 配置日志
logger = logging.getLogger(__name__)

@analytics_bp.route('/analytics/search-stats', methods=['GET'])
def get_search_stats():
    """获取检索统计概览"""
    try:
        # 时间范围参数
        days = request.args.get('days', 7, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)

        # 基础统计
        total_searches = SearchAnalytics.query.filter(
            SearchAnalytics.created_at >= start_date
        ).count()

        unique_users = db.session.query(
            func.count(func.distinct(SearchAnalytics.session_id))
        ).filter(SearchAnalytics.created_at >= start_date).scalar() or 0

        avg_response_time = db.session.query(
            func.avg(SearchAnalytics.response_time)
        ).filter(
            SearchAnalytics.created_at >= start_date,
            SearchAnalytics.response_time.isnot(None)
        ).scalar()

        # 成功率统计
        success_count = db.session.query(
            func.count(SearchAnalytics.id)
        ).filter(
            SearchAnalytics.created_at >= start_date,
            SearchAnalytics.response_status == 'success'
        ).scalar() or 0

        success_rate = (success_count / max(total_searches, 1)) * 100

        return jsonify({
            'status': 'success',
            'data': {
                'total_searches': total_searches,
                'unique_users': unique_users,
                'avg_response_time': round(avg_response_time or 0, 2),
                'success_rate': round(success_rate, 2),
                'date_range': {
                    'start': start_date.isoformat(),
                    'end': datetime.utcnow().isoformat()
                }
            }
        })
    except Exception as e:
        logger.error(f"获取搜索统计失败: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@analytics_bp.route('/analytics/popular-queries', methods=['GET'])
def get_popular_queries():
    """获取热门查询"""
    try:
        days = request.args.get('days', 7, type=int)
        limit = request.args.get('limit', 20, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)

        # 热门查询统计
        popular_queries = db.session.query(
            SearchAnalytics.normalized_query,
            func.count(SearchAnalytics.id).label('count'),
            func.max(SearchAnalytics.created_at).label('last_searched')
        ).filter(
            SearchAnalytics.created_at >= start_date
        ).group_by(
            SearchAnalytics.normalized_query
        ).order_by(
            desc('count')
        ).limit(limit).all()

        result = []
        for query, count, last_searched in popular_queries:
            result.append({
                'query': query,
                'count': count,
                'last_searched': last_searched.isoformat()
            })

        return jsonify({
            'status': 'success',
            'data': result
        })
    except Exception as e:
        logger.error(f"获取热门查询失败: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@analytics_bp.route('/analytics/scene-distribution', methods=['GET'])
def get_scene_distribution():
    """获取场景分布统计"""
    try:
        days = request.args.get('days', 7, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)

        scene_stats = db.session.query(
            Scene.id,
            Scene.description,
            func.count(SearchAnalytics.id).label('count')
        ).outerjoin(
            SearchAnalytics,
            (SearchAnalytics.scene_id == Scene.id) &
            (SearchAnalytics.created_at >= start_date)
        ).group_by(
            Scene.id, Scene.description
        ).all()

        result = []
        total = sum(stat.count for stat in scene_stats)

        for scene_id, description, count in scene_stats:
            percentage = (count / max(total, 1)) * 100
            result.append({
                'scene_id': scene_id,
                'scene_name': description,
                'count': count,
                'percentage': round(percentage, 2)
            })

        # 按使用量排序
        result.sort(key=lambda x: x['count'], reverse=True)

        return jsonify({
            'status': 'success',
            'data': result
        })
    except Exception as e:
        logger.error(f"获取场景分布失败: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@analytics_bp.route('/analytics/trending-keywords', methods=['GET'])
def get_trending_keywords():
    """获取趋势关键词"""
    try:
        limit = request.args.get('limit', 30, type=int)

        trending = SearchKeywords.query.order_by(
            desc(SearchKeywords.search_count)
        ).limit(limit).all()

        result = []
        for keyword in trending:
            result.append({
                'keyword': keyword.keyword,
                'count': keyword.search_count,
                'last_searched': keyword.last_searched.isoformat()
            })

        return jsonify({
            'status': 'success',
            'data': result
        })
    except Exception as e:
        logger.error(f"获取趋势关键词失败: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@analytics_bp.route('/analytics/time-series', methods=['GET'])
def get_time_series():
    """获取时间序列数据"""
    try:
        days = request.args.get('days', 7, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)

        # 对于SQLite，使用strftime函数按小时统计
        time_series = db.session.query(
            func.strftime('%Y-%m-%d %H:00:00', SearchAnalytics.created_at).label('hour'),
            func.count(SearchAnalytics.id).label('count')
        ).filter(
            SearchAnalytics.created_at >= start_date
        ).group_by(
            func.strftime('%Y-%m-%d %H:00:00', SearchAnalytics.created_at)
        ).order_by('hour').all()

        result = []
        for hour, count in time_series:
            # 转换为ISO格式
            hour_dt = datetime.strptime(hour, '%Y-%m-%d %H:%M:%S')
            result.append({
                'time': hour_dt.isoformat(),
                'count': count
            })

        return jsonify({
            'status': 'success',
            'data': result
        })
    except Exception as e:
        logger.error(f"获取时间序列数据失败: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@analytics_bp.route('/analytics/export', methods=['GET'])
def export_analytics():
    """导出分析数据"""
    try:
        days = request.args.get('days', 7, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)

        # 获取原始数据
        raw_data = db.session.query(
            SearchAnalytics.query_text,
            SearchAnalytics.scene_id,
            SearchAnalytics.response_time,
            SearchAnalytics.response_status,
            SearchAnalytics.created_at
        ).filter(
            SearchAnalytics.created_at >= start_date
        ).all()

        # 转换为CSV格式
        import io
        import csv

        output = io.StringIO()
        writer = csv.writer(output)

        # 写入标题行
        writer.writerow(['查询内容', '场景ID', '响应时间(ms)', '响应状态', '创建时间'])

        # 写入数据行
        for row in raw_data:
            writer.writerow([
                row.query_text,
                row.scene_id or '',
                row.response_time or '',
                row.response_status,
                row.created_at.isoformat()
            ])

        csv_content = output.getvalue()
        output.close()

        # 返回CSV数据
        from flask import Response
        return Response(
            csv_content,
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment; filename=search_analytics_{days}days.csv'}
        )

    except Exception as e:
        logger.error(f"导出数据失败: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# 工具函数：记录搜索行为
def log_search_query(query_text, scene_id=None, session_id=None,
                    ip_address=None, user_agent=None, response_time=None,
                    response_status='success', api_source='primary'):
    """记录搜索查询"""
    try:
        # 标准化查询文本
        normalized_query = normalize_query(query_text)

        # 记录详细分析数据
        analytics = SearchAnalytics(
            query_text=query_text,
            normalized_query=normalized_query,
            scene_id=scene_id,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent,
            response_time=response_time,
            response_status=response_status,
            api_source=api_source,
            query_length=len(query_text)
        )
        db.session.add(analytics)

        # 更新关键词统计
        keywords = extract_keywords(query_text)
        for keyword in keywords:
            update_keyword_stats(keyword)

        db.session.commit()
        logger.info(f"记录搜索查询成功: {query_text[:50]}")

    except Exception as e:
        db.session.rollback()
        logger.error(f"记录搜索失败: {e}")

def normalize_query(text):
    """标准化查询文本"""
    if not text:
        return ""

    # 转小写，去除标点，合并空白
    text = re.sub(r'[^\w\s]', '', text.lower())
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_keywords(text):
    """提取关键词"""
    if not text:
        return []

    try:
        # 使用jieba分词
        words = jieba.cut(text)

        # 停用词列表
        stopwords = {'的', '是', '了', '在', '有', '和', '就', '不', '到', '说', '要', '去',
                    '你', '我', '他', '她', '它', '这', '那', '一个', '什么', '怎么', '为什么',
                    '吗', '吧', '呢', '啊', '哦', '嗯', '哈', '嘿', '呵'}

        # 过滤停用词和短词
        keywords = [word for word in words
                   if len(word) > 1 and word not in stopwords and word.strip()]

        return keywords[:5]  # 最多保留5个关键词

    except Exception as e:
        logger.error(f"提取关键词失败: {e}")
        return []

def update_keyword_stats(keyword):
    """更新关键词统计"""
    if not keyword or len(keyword.strip()) <= 1:
        return

    try:
        keyword = keyword.strip()
        existing = SearchKeywords.query.filter_by(keyword=keyword).first()

        if existing:
            existing.search_count += 1
            existing.last_searched = datetime.utcnow()
        else:
            new_keyword = SearchKeywords(keyword=keyword)
            db.session.add(new_keyword)

    except Exception as e:
        logger.error(f"更新关键词统计失败: {e}")

@analytics_bp.route('/analytics/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    try:
        # 简单查询测试数据库连接
        count = SearchAnalytics.query.count()
        return jsonify({
            'status': 'success',
            'message': 'Analytics service is healthy',
            'total_records': count
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Service unhealthy: {str(e)}'
        }), 500