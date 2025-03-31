from flask import Blueprint, jsonify, request
from app.models.log import Log

logs_api = Blueprint('logs_api', __name__)

@logs_api.route('/logs', methods=['GET'])
def get_logs():
    logs = Log.query.all()
    return jsonify([log.to_dict() for log in logs]), 200

@logs_api.route('/logs/<int:log_id>', methods=['GET'])
def get_log(log_id):
    log = Log.query.get_or_404(log_id)
    return jsonify(log.to_dict()), 200

@logs_api.route('/logs', methods=['POST'])
def create_log():
    data = request.get_json()
    new_log = Log(**data)
    new_log.save()
    return jsonify(new_log.to_dict()), 201

@logs_api.route('/logs/<int:log_id>', methods=['DELETE'])
def delete_log(log_id):
    log = Log.query.get_or_404(log_id)
    log.delete()
    return jsonify({'message': 'Log deleted successfully'}), 204