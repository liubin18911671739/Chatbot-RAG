from flask import jsonify
import base64
from routes import bp  # 使用共享的Blueprint

@bp.route('/suggestions', methods=['GET'])
def get_suggestions():
    """获取所有学生问题"""  
    # 模拟学生问题数据
    questions = {
        "status": "success",
        "suggestions": [
            "党政办公室综合事务的电话是多少？",
            "党政办公室综合事务的办公室是？",
            "65778005是哪个部门的电话？",
            "明德楼303是哪个部门的办公室？",
            "党政办公室党办事务的电话是多少？",
            "党政办公室党办事务的办公室是？",
            "65778315是哪个部门的电话？",
            "明德楼316是哪个部门的办公室？",
            "党政办公室发展规划的电话是多少？"
     ]
    }
    
    try:
        return jsonify(questions), 200
        
    except Exception as e:
        print(f"获取所有问题时发生错误: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "获取问题列表失败",
            "error": str(e)
        }), 500

# @bp.route('/unreviewed', methods=['GET'])
# def get_pending_questions():
#     """获取未审核的学生问题ID列表"""
    
#     # 模拟未审核问题的ID列表
#     pending_ids = [2, 4, 5]  # 假设ID为2、4、5的问题未审核
    
#     try:
#         return jsonify(pending_ids), 200
        
#     except Exception as e:
#         print(f"获取未审核问题时发生错误: {str(e)}")
#         return jsonify({
#             "status": "error",
#             "message": "获取未审核问题失败",
#             "error": str(e)
#         }), 500
