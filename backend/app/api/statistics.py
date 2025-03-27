from flask import Blueprint, jsonify, current_app
from datetime import datetime
import logging
from pymongo import MongoClient

bp = Blueprint('statistics', __name__)

@bp.route('/statistics', methods=['GET'])
def get_statistics():
    try:
        # 获取MongoDB连接配置
        MONGODB_SETTINGS = {
            'uri': 'mongodb://localhost:27017',
            'db': 'news_system',
            'collection': 'articles'
        }
        
        # 初始化MongoClient
        logging.info("尝试连接到MongoDB")
        client = MongoClient(MONGODB_SETTINGS['uri'])
        mongo = client[MONGODB_SETTINGS['db']]
        logging.info("成功连接到MongoDB")
        
        # 获取文档总数
        document_count = mongo[MONGODB_SETTINGS['collection']].count_documents({})
        logging.info(f"文档总数: {document_count}")
        
        # 获取区域数量 (基于文档中的不同区域)
        region_count = len(mongo[MONGODB_SETTINGS['collection']].distinct('region'))
        logging.info(f"区域数量: {region_count}")
        
        # 获取语言数量 (基于文档中的不同语言)
        language_count = len(mongo[MONGODB_SETTINGS['collection']].distinct('language'))
        logging.info(f"语言数量: {language_count}")
        
        # 获取最后更新时间
        latest_doc = mongo[MONGODB_SETTINGS['collection']].find_one(
            {}, 
            sort=[('updated_at', -1)]
        )
        logging.info(f"最新文档: {latest_doc}")
        
        if latest_doc and 'updated_at' in latest_doc:
            last_update_date = latest_doc['updated_at']
            
            # 格式化日期
            today = datetime.now().date()
            doc_date = last_update_date.date() if isinstance(last_update_date, datetime) else last_update_date
            
            if doc_date == today:
                last_update = "今天"
            else:
                last_update = last_update_date.strftime("%Y-%m-%d")
        else:
            last_update = "暂无更新"
        
        return jsonify({
            'success': True,
            'data': {
                'documentCount': document_count,
                'regionCount': region_count,
                'languageCount': language_count,
                'lastUpdate': last_update
            }
        })
        
    except Exception as e:
        logging.error(f"获取统计数据时出错: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500