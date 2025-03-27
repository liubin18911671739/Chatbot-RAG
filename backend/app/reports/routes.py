from flask import Blueprint, jsonify

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/status', methods=['GET'])
def reports_status():
    """报告状态API"""
    return jsonify({
        'status': 'ok',
        'message': '报告模块已初始化但功能尚未完成'
    })