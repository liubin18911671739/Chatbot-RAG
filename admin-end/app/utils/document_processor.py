import os
import docx
import PyPDF2
from werkzeug.utils import secure_filename

def process_document(file, document_type=None, category=None):
    """
    处理上传的文档文件
    
    Args:
        file: 上传的文件对象
        document_type: 文档类型 (pdf, docx, txt)
        category: 文档分类
        
    Returns:
        dict: 包含处理结果的字典
    """
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join('uploads', filename)
        file.save(file_path)
        
        # 提取文本
        text = extract_text(file_path, document_type)
        
        # 这里可以添加更多处理逻辑，如文本分割、向量化等
        
        return {
            "status": "success",
            "message": "文档处理成功",
            "filename": filename,
            "category": category,
            "text_length": len(text) if text else 0
        }
    
    return {"status": "error", "message": "无效的文件类型"}

def allowed_file(filename):
    """检查文件类型是否允许"""
    ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text(file_path, document_type=None):
    """根据文件类型提取文本"""
    if not document_type:
        document_type = file_path.rsplit('.', 1)[1].lower()
    
    text = ""
    
    try:
        if document_type == 'pdf':
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    text += page.extract_text() + "\n"
        
        elif document_type in ['doc', 'docx']:
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"
        
        elif document_type == 'txt':
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
    
    except Exception as e:
        print(f"文本提取错误: {str(e)}")
    
    return text

# 确保上传目录存在
os.makedirs('uploads', exist_ok=True)