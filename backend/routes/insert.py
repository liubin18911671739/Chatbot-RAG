from flask import request, jsonify
from routes import bp

# 模拟的问题答案数据库（内存存储）
mock_qa_database = [
    {
        "id": 1,
        "question": "党政办公室综合事务的电话是多少？",
        "answer": "党政办公室综合事务的电话是65778005",
        "userid": "user1",
        "status": "reviewed"
    },
    {
        "id": 2,
        "question": "党政办公室综合事务的办公室是？",
        "answer": "党政办公室综合事务的办公室在明德楼303",
        "userid": "user2",
        "status": "reviewed"
    },
    {
        "id": 3,
        "question": "65778005是哪个部门的电话？",
        "answer": "65778005是党政办公室综合事务的电话",
        "userid": "user3",
        "status": "unreview"
    }
]

@bp.route('/insert', methods=['POST'])
def insert_question():
    """处理问题插入请求，包含查重功能"""
    try:
        data = request.get_json()
        
        # 验证输入数据
        if not data:
            return jsonify({
                "status": "error",
                "message": "请求数据不能为空"
            }), 400
        
        # 验证必填字段
        required_fields = ['question', 'answer', 'userid']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    "status": "error",
                    "message": f"缺少必填字段: {field}"
                }), 400
        
        question = data['question'].strip()
        answer = data['answer'].strip()
        userid = data['userid'].strip()
        status = data.get('status', 'unreview')  # 默认状态为未审核
        
        # 验证状态值
        valid_statuses = ['reviewed', 'unreview']
        if status not in valid_statuses:
            return jsonify({
                "status": "error",
                "message": f"无效的状态值。允许的状态: {', '.join(valid_statuses)}"
            }), 400
        
        # 查重检查 - 检查是否已存在相同问题
        duplicate_question = check_duplicate_question(question)
        if duplicate_question:
            return jsonify({
                "status": "error",
                "message": "问题已存在",
                "duplicate_id": duplicate_question['id'],
                "existing_question": duplicate_question['question']
            }), 409
        
        # 模拟插入新问题
        new_question = {
            "id": len(mock_qa_database) + 1,
            "question": question,
            "answer": answer,
            "userid": userid,
            "status": status
        }
        
        # 添加到模拟数据库
        mock_qa_database.append(new_question)
        
        print(f"成功插入新问题: ID={new_question['id']}, 问题={question}, 用户={userid}, 状态={status}")
        
        return jsonify({
            "status": "success",
            "message": "问题插入成功",
            "data": {
                "id": new_question['id'],
                "question": question,
                "answer": answer,
                "userid": userid,
                "status": status
            }
        }), 201
        
    except Exception as e:
        print(f"插入问题时发生错误: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "插入问题失败",
            "error": str(e)
        }), 500

def check_duplicate_question(question):
    """检查问题是否重复"""
    question_lower = question.lower().strip()
    
    for qa in mock_qa_database:
        if qa['question'].lower().strip() == question_lower:
            return qa
    
    return None

@bp.route('/questions', methods=['GET'])
def get_all_questions():
    """获取所有问题（用于测试和验证）"""
    try:
        return jsonify({
            "status": "success",
            "message": "获取问题列表成功",
            "total": len(mock_qa_database),
            "data": mock_qa_database
        }), 200
        
    except Exception as e:
        print(f"获取问题列表时发生错误: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "获取问题列表失败",
            "error": str(e)
        }), 500

@bp.route('/questions/<int:question_id>', methods=['GET'])
def get_question_by_id(question_id):
    """根据ID获取特定问题"""
    try:
        question = next((qa for qa in mock_qa_database if qa['id'] == question_id), None)
        
        if not question:
            return jsonify({
                "status": "error",
                "message": f"未找到ID为 {question_id} 的问题"
            }), 404
        
        return jsonify({
            "status": "success",
            "message": "获取问题成功",
            "data": question
        }), 200
        
    except Exception as e:
        print(f"获取问题时发生错误: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "获取问题失败",
            "error": str(e)
        }), 500

@bp.route('/questions/status/<status>', methods=['GET'])
def get_questions_by_status(status):
    """根据状态获取问题列表"""
    try:
        valid_statuses = ['reviewed', 'unreview']
        if status not in valid_statuses:
            return jsonify({
                "status": "error",
                "message": f"无效的状态值。允许的状态: {', '.join(valid_statuses)}"
            }), 400
        
        filtered_questions = [qa for qa in mock_qa_database if qa['status'] == status]
        
        return jsonify({
            "status": "success",
            "message": f"获取状态为 '{status}' 的问题列表成功",
            "total": len(filtered_questions),
            "data": filtered_questions
        }), 200
        
    except Exception as e:
        print(f"获取问题列表时发生错误: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "获取问题列表失败",
            "error": str(e)
        }), 500

@bp.route('/update/<int:question_id>', methods=['PUT'])
def update_question(question_id):
    """更新问题信息（主要用于状态更新）"""
    try:
        data = request.get_json()
        
        # 验证输入数据
        if not data:
            return jsonify({
                "status": "error",
                "message": "请求数据不能为空"
            }), 400
        
        # 查找要更新的问题
        question = next((qa for qa in mock_qa_database if qa['id'] == question_id), None)
        
        if not question:
            return jsonify({
                "status": "error",
                "message": f"未找到ID为 {question_id} 的问题"
            }), 404
        
        # 更新允许的字段
        if 'status' in data:
            valid_statuses = ['reviewed', 'unreview']
            if data['status'] not in valid_statuses:
                return jsonify({
                    "status": "error",
                    "message": f"无效的状态值。允许的状态: {', '.join(valid_statuses)}"
                }), 400
            question['status'] = data['status']
        
        if 'answer' in data:
            question['answer'] = data['answer'].strip()
        
        if 'question' in data:
            question['question'] = data['question'].strip()
        
        print(f"成功更新问题: ID={question_id}, 新状态={question.get('status', '未更新')}")
        
        return jsonify({
            "status": "success",
            "message": "问题更新成功",
            "data": question
        }), 200
        
    except Exception as e:
        print(f"更新问题时发生错误: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "更新问题失败",
            "error": str(e)
        }), 500
