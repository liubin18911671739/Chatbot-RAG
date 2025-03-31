from flask import request, jsonify
from routes import bp  # 使用共享的Blueprint

@bp.route('/chat', methods=['POST'])
def chat():
    """处理聊天请求"""
    data = request.get_json()
    
    # 输出调试信息
    print(f"收到聊天请求: {data}")
    
    # 验证输入数据
    if not data or 'prompt' not in data:
        print("错误: 缺少prompt字段")
        return jsonify({"status": "error", "message": "缺少提示信息"}), 400
    
    prompt = data['prompt']
    scene_id = data.get('scene_id')  # 支持可选的scene_id参数
    
    try:
        # 这里实现您的聊天逻辑
        # 简单示例响应
        response = {
            "status": "success",
            "response": f"您的问题是: {prompt}",
            "attachment_data": [],
            "special_note": ""
        }
        
        print(f"返回响应: {response}")
        return jsonify(response)
    except Exception as e:
        print(f"处理聊天请求时出错: {str(e)}")
        return jsonify({"status": "error", "message": "处理请求时出错"}), 500