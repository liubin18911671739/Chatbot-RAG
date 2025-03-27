from flask import Blueprint, request, jsonify, current_app
from ..utils.text_processor import process_text
from ..models.crawler_config import CrawlerConfig
from ..models.news import News
from datetime import datetime
import uuid
import sys
import os

# 创建爬虫蓝图
crawler_bp = Blueprint('crawler', __name__)

# 模拟爬虫任务存储
_crawler_tasks = {}

@crawler_bp.route('/start_crawl', methods=['POST'])
def start_crawl():
    data = request.json
    urls = data.get('urls', [])
    if not urls:
        return jsonify({'error': 'No URLs provided'}), 400

    # 简化版的爬虫启动过程
    task_id = str(uuid.uuid4())
    _crawler_tasks[task_id] = {
        'id': task_id,
        'urls': urls,
        'status': 'pending',
        'created_at': datetime.now().isoformat()
    }

    return jsonify({'message': 'Crawling started', 'task_id': task_id}), 200

@crawler_bp.route('/config', methods=['GET', 'POST'])
def config_crawler():
    if request.method == 'POST':
        data = request.json
        config = CrawlerConfig(**data)
        config.save()
        return jsonify({'message': 'Crawler configuration saved'}), 201

    configs = CrawlerConfig.query.all()
    return jsonify([config.to_dict() for config in configs]), 200

@crawler_bp.route('/news', methods=['GET'])
def get_news():
    news_items = News.query.all()
    return jsonify([news.to_dict() for news in news_items]), 200

@crawler_bp.route('/process_text', methods=['POST'])
def process_news_text():
    data = request.json
    text = data.get('text', '')
    if not text:
        return jsonify({'error': 'No text provided'}), 400

    processed_text = process_text(text)
    return jsonify({'processed_text': processed_text}), 200

@crawler_bp.route('/crawlers', methods=['GET'])
def list_crawlers():
    """获取所有可用爬虫列表"""
    try:
        # 获取筛选参数
        language = request.args.get('language')
        status = request.args.get('status')
        
        # 示例爬虫列表
        crawlers = [
            {
                'id': 'bbc',
                'name': 'BBC News',
                'url': 'https://www.bbc.com/news',
                'languages': ['en'],
                'countries': ['UK'],
                'status': 'active',
                'last_run': '2025-03-22T14:30:00Z',
                'articles_count': 4520
            },
            # ...其他爬虫配置...
        ]
        
        # 根据语言筛选
        if language:
            crawlers = [c for c in crawlers if language in c['languages']]
            
        # 根据状态筛选
        if status:
            crawlers = [c for c in crawlers if c['status'] == status]
        
        return jsonify({
            'status': 'success',
            'count': len(crawlers),
            'data': crawlers
        })
        
    except Exception as e:
        current_app.logger.error(f"获取爬虫列表时出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': '获取爬虫列表时发生错误'
        }), 500

@crawler_bp.route('/crawlers/tasks', methods=['POST'])
def start_crawler_task():
    """启动爬虫任务"""
    try:
        data = request.json
        
        if not data or 'crawler_id' not in data:
            return jsonify({
                'status': 'error',
                'message': '缺少必要参数'
            }), 400
            
        crawler_id = data.get('crawler_id')
        params = data.get('params', {})
        
        # 生成任务ID
        task_id = str(uuid.uuid4())
        
        # 记录任务信息
        _crawler_tasks[task_id] = {
            'id': task_id,
            'crawler_id': crawler_id,
            'params': params,
            'status': 'pending',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        return jsonify({
            'status': 'success',
            'message': f'已成功启动爬虫任务',
            'task_id': task_id
        })
    except Exception as e:
        current_app.logger.error(f"启动爬虫任务时出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': '启动爬虫任务时发生错误'
        }), 500

@crawler_bp.route('/crawlers/tasks/<task_id>', methods=['GET'])
def get_task_status(task_id):
    """获取爬虫任务状态"""
    try:
        if task_id not in _crawler_tasks:
            return jsonify({
                'status': 'error',
                'message': '任务不存在'
            }), 404
            
        task = _crawler_tasks[task_id]
        
        # 模拟任务进度
        import random
        if task['status'] == 'pending':
            task['status'] = 'running'
            task['progress'] = 10
        elif task['status'] == 'running':
            task['progress'] = min(task.get('progress', 0) + random.randint(5, 15), 100)
            if task['progress'] >= 100:
                task['status'] = 'completed'
                task['progress'] = 100
                task['completed_at'] = datetime.now().isoformat()
                
        task['updated_at'] = datetime.now().isoformat()
        
        return jsonify({
            'status': 'success',
            'data': task
        })
    except Exception as e:
        current_app.logger.error(f"获取任务状态时出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': '获取任务状态时发生错误'
        }), 500

@crawler_bp.route('/crawlers/tasks/<task_id>', methods=['DELETE'])
def cancel_task(task_id):
    """取消爬虫任务"""
    try:
        if task_id not in _crawler_tasks:
            return jsonify({
                'status': 'error',
                'message': '任务不存在'
            }), 404
            
        task = _crawler_tasks[task_id]
        
        if task['status'] in ['completed', 'failed', 'cancelled']:
            return jsonify({
                'status': 'error',
                'message': f'无法取消已{task["status"]}的任务'
            }), 400
            
        task['status'] = 'cancelled'
        task['updated_at'] = datetime.now().isoformat()
        
        return jsonify({
            'status': 'success',
            'message': '任务已取消'
        })
    except Exception as e:
        current_app.logger.error(f"取消任务时出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': '取消任务时发生错误'
        }), 500

@crawler_bp.route('/crawlers/stats', methods=['GET'])
def get_crawler_stats():
    """获取爬虫系统统计信息"""
    try:
        # 在实际应用中，这些数据应从数据库查询
        stats = {
            'crawlers': {
                'total': 7,
                'active': 5,
                'inactive': 1,
                'maintenance': 1
            },
            'tasks': {
                'total': len(_crawler_tasks),
                'pending': sum(1 for t in _crawler_tasks.values() if t.get('status') == 'pending'),
                'running': sum(1 for t in _crawler_tasks.values() if t.get('status') == 'running'),
                'completed': sum(1 for t in _crawler_tasks.values() if t.get('status') == 'completed'),
                'failed': sum(1 for t in _crawler_tasks.values() if t.get('status') == 'failed'),
                'cancelled': sum(1 for t in _crawler_tasks.values() if t.get('status') == 'cancelled')
            },
            'articles': {
                'total': 28640,
                'by_language': {
                    'en': 12260,
                    'zh': 11930,
                    'fr': 2870,
                    'de': 3450,
                    'ar': 2980
                }
            },
            'performance': {
                'avg_task_duration': '15m 23s',
                'avg_articles_per_task': 87,
                'tasks_today': 12,
                'articles_today': 1035
            }
        }
        
        return jsonify({
            'status': 'success',
            'data': stats,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        current_app.logger.error(f"获取爬虫统计信息时出错: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': '获取爬虫统计信息时发生错误'
        }), 500
