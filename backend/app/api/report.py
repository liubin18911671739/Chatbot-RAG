from flask import Blueprint, request, jsonify, current_app
from llm.report_generator import generate_report
from datetime import datetime, timedelta
import json

report_bp = Blueprint('report', __name__)

@report_bp.route('/report', methods=['POST'])
def create_report():
    data = request.json
    if not data or 'news_ids' not in data:
        return jsonify({'error': 'Invalid input'}), 400

    news_ids = data['news_ids']
    report = generate_report(news_ids)

    return jsonify({'report': report}), 200

def setup_report_routes(api):
    """
    设置报告相关的API路由
    
    参数:
        api: Flask Blueprint对象，用于注册路由
    """
    
    @api.route('/reports/summary', methods=['GET'])
    def get_report_summary():
        """获取系统概要统计报告"""
        try:
            # 获取时间范围参数
            days = request.args.get('days', 30, type=int)
            
            # 在实际实现中，这应该查询数据库获取真实统计数据
            summary = {
                'status': 'success',
                'timestamp': datetime.now().isoformat(),
                'period': f'最近{days}天',
                'stats': {
                    'total_news': 12450,
                    'languages': {
                        'en': 5230,
                        'zh': 3120,
                        'fr': 980,
                        'de': 870,
                        'es': 1250,
                        'other': 1000
                    },
                    'countries': {
                        'China': 3850,
                        'USA': 3120,
                        'UK': 1540,
                        'France': 980,
                        'Germany': 870,
                        'other': 2090
                    },
                    'growth': {
                        'daily_avg': 240,
                        'weekly_growth': 8.5,
                        'monthly_growth': 22.3
                    }
                }
            }
            
            return jsonify(summary)
            
        except Exception as e:
            current_app.logger.error(f"生成概要报告时出错: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': '生成报告时发生错误'
            }), 500
    
    @api.route('/reports/trend', methods=['GET'])
    def get_trend_report():
        """获取新闻发布趋势分析报告"""
        try:
            # 解析请求参数
            days = request.args.get('days', 30, type=int)
            language = request.args.get('language')
            country = request.args.get('country')
            
            if days <= 0 or days > 365:
                return jsonify({
                    'status': 'error',
                    'message': '天数必须在1到365之间'
                }), 400
            
            # 生成示例趋势数据
            trend_data = []
            base_count = 100
            
            for i in range(days):
                date = (datetime.now() - timedelta(days=days-i-1)).strftime('%Y-%m-%d')
                # 创建波动的数据模式
                count = base_count + i * 5 + (i % 7) * 20
                
                # 根据语言或国家筛选
                if language:
                    # 模拟不同语言的分布
                    language_factors = {
                        'en': 1.0, 'zh': 0.8, 'fr': 0.5, 
                        'de': 0.4, 'es': 0.6, 'ar': 0.3
                    }
                    factor = language_factors.get(language, 0.2)
                    count = int(count * factor)
                
                if country:
                    # 模拟不同国家的分布
                    country_factors = {
                        'China': 0.9, 'USA': 1.0, 'UK': 0.7,
                        'France': 0.5, 'Germany': 0.6, 'Japan': 0.4
                    }
                    factor = country_factors.get(country, 0.3)
                    count = int(count * factor)
                
                trend_data.append({
                    'date': date,
                    'count': count
                })
            
            # 计算统计数据
            total = sum(item['count'] for item in trend_data)
            avg = total / days if days > 0 else 0
            
            return jsonify({
                'status': 'success',
                'data': trend_data,
                'stats': {
                    'total': total,
                    'average': avg,
                    'max': max(item['count'] for item in trend_data),
                    'min': min(item['count'] for item in trend_data)
                },
                'filters': {
                    'days': days,
                    'language': language,
                    'country': country
                }
            })
            
        except Exception as e:
            current_app.logger.error(f"生成趋势报告时出错: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': '生成趋势报告时发生错误'
            }), 500
    
    @api.route('/reports/topics', methods=['GET'])
    def get_topics_report():
        """获取热门话题分析报告"""
        try:
            # 解析请求参数
            limit = request.args.get('limit', 10, type=int)
            language = request.args.get('language')
            
            # 验证参数
            if limit <= 0 or limit > 100:
                return jsonify({
                    'status': 'error',
                    'message': '主题数量必须在1到100之间'
                }), 400
            
            # 示例热门话题数据
            all_topics = [
                {'name': '气候变化', 'count': 345, 'sentiment': 0.2, 'language': 'zh'},
                {'name': '经济发展', 'count': 289, 'sentiment': 0.5, 'language': 'zh'},
                {'name': '国际关系', 'count': 267, 'sentiment': -0.1, 'language': 'zh'},
                {'name': '科技创新', 'count': 245, 'sentiment': 0.8, 'language': 'zh'},
                {'name': '公共卫生', 'count': 198, 'sentiment': 0.3, 'language': 'zh'},
                {'name': 'Climate Change', 'count': 432, 'sentiment': 0.1, 'language': 'en'},
                {'name': 'Economic Growth', 'count': 356, 'sentiment': 0.6, 'language': 'en'},
                {'name': 'International Relations', 'count': 321, 'sentiment': -0.2, 'language': 'en'},
                {'name': 'Technology', 'count': 298, 'sentiment': 0.7, 'language': 'en'},
                {'name': 'Healthcare', 'count': 245, 'sentiment': 0.4, 'language': 'en'},
                {'name': 'Changement Climatique', 'count': 189, 'sentiment': 0.3, 'language': 'fr'},
                {'name': 'Développement Économique', 'count': 156, 'sentiment': 0.4, 'language': 'fr'},
                {'name': 'Relations Internationales', 'count': 134, 'sentiment': -0.1, 'language': 'fr'},
                {'name': 'Innovation Technologique', 'count': 123, 'sentiment': 0.6, 'language': 'fr'},
                {'name': 'Santé Publique', 'count': 98, 'sentiment': 0.2, 'language': 'fr'}
            ]
            
            # 根据语言筛选
            if language:
                topics = [t for t in all_topics if t['language'] == language]
            else:
                topics = all_topics
            
            # 排序并限制数量
            topics.sort(key=lambda x: x['count'], reverse=True)
            topics = topics[:limit]
            
            return jsonify({
                'status': 'success',
                'data': topics,
                'count': len(topics),
                'filters': {
                    'limit': limit,
                    'language': language
                },
                'updated_at': datetime.now().isoformat()
            })
            
        except Exception as e:
            current_app.logger.error(f"生成热门话题报告时出错: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': '生成热门话题报告时发生错误'
            }), 500
    
    @api.route('/reports/export', methods=['POST'])
    def export_report():
        """导出自定义报告"""
        try:
            data = request.json
            if not data:
                return jsonify({
                    'status': 'error',
                    'message': '缺少导出参数'
                }), 400
            
            report_type = data.get('type')
            if not report_type:
                return jsonify({
                    'status': 'error',
                    'message': '必须指定报告类型'
                }), 400
            
            # 根据报告类型生成不同的导出内容
            if report_type == 'summary':
                # 这里应该调用实际的报告生成逻辑
                file_id = f"summary-{datetime.now().strftime('%Y%m%d%H%M%S')}"
                
                return jsonify({
                    'status': 'success',
                    'message': '报告导出任务已创建',
                    'file_id': file_id,
                    'download_url': f"/api/reports/download/{file_id}",
                    'expires_at': (datetime.now() + timedelta(days=7)).isoformat()
                })
            else:
                return jsonify({
                    'status': 'error',
                    'message': f'不支持的报告类型: {report_type}'
                }), 400
                
        except Exception as e:
            current_app.logger.error(f"导出报告时出错: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': '导出报告时发生错误'
            }), 500
    
    # 记录路由注册
    current_app.logger.info("报告API路由已成功注册")
    
    return True  # 表示路由注册成功