from flask import Blueprint, jsonify
from app.models.log import Log
from app.models.user import User

statistics_bp = Blueprint('statistics', __name__)

@statistics_bp.route('/api/statistics', methods=['GET'])
def get_statistics():
    total_users = User.query.count()
    total_logs = Log.query.count()
    
    # Here you can add more statistics as needed
    statistics = {
        'total_users': total_users,
        'total_logs': total_logs,
        # Add more statistics here
    }
    
    return jsonify(statistics)