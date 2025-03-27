import re
import nltk
import numpy as np
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from langdetect import detect, LangDetectException

# 确保NLTK数据可用
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

class TextProcessor:
    """文本处理类，提供文本清洗、分词、关键词提取和向量化等功能"""
    
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.model = None
        self.model_name = model_name
        # 延迟加载模型
    
    def _load_model(self):
        """按需加载模型，节省内存"""
        if self.model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self.model = SentenceTransformer(self.model_name)
            except ImportError:
                print("请安装sentence-transformers: pip install sentence-transformers")
                raise
    
    def text_to_vector(self, text):
        """将文本转换为向量表示"""
        if not text:
            return np.zeros(384)  # 返回零向量，维度与模型输出一致
            
        # 清理文本
        text = self.clean_text(text)
        
        try:
            # 加载模型并生成向量
            self._load_model()
            vector = self.model.encode(text)
            return vector
        except Exception as e:
            print(f"文本向量化失败: {e}")
            # 返回零向量作为备选
            return np.zeros(384)
    
    @staticmethod
    def process_text(text, language=None):
        """
        处理文本：清洗、标准化和提取特征
        
        参数：
        text (str): 需要处理的文本
        language (str, optional): 文本语言。如果未提供，会尝试自动检测。
        
        返回：
        dict: 包含处理后文本和元数据的字典
        """
        if not text:
            return {
                'processed_text': '',
                'tokens': [],
                'language': None,
                'word_count': 0,
                'keywords': []
            }
        
        # 清理文本（移除多余空格、HTML标签等）
        cleaned_text = TextProcessor.clean_text(text)
        
        # 检测语言
        if not language:
            try:
                language = detect(cleaned_text)
            except LangDetectException:
                language = 'unknown'
        
        # 分词
        tokens = TextProcessor.tokenize_text(cleaned_text, language)
        
        # 提取关键词
        keywords = TextProcessor.extract_keywords(cleaned_text, language)
        
        return {
            'processed_text': cleaned_text,
            'tokens': tokens,
            'language': language,
            'word_count': len(tokens),
            'keywords': keywords
        }
    
    @staticmethod
    def clean_text(text):
        """清理文本，移除HTML标签和多余空格"""
        # 移除HTML标签
        text = re.sub(r'<.*?>', '', text)
        
        # 移除URL
        text = re.sub(r'http\S+', '', text)
        
        # 替换多个空格为单个空格
        text = re.sub(r'\s+', ' ', text)
        
        # 去除前后空格
        text = text.strip()
        
        return text
    
    @staticmethod
    def tokenize_text(text, language):
        """根据语言对文本进行分词"""
        try:
            tokens = word_tokenize(text)
            
            # 过滤停用词
            if language in stopwords.fileids():
                stop_words = set(stopwords.words(language))
                tokens = [token for token in tokens if token.lower() not in stop_words]
            
            return tokens
        except Exception as e:
            print(f"分词过程发生错误: {e}")
            # 简单分词方案作为备用
            return text.split()
    
    @staticmethod
    def extract_keywords(text, language, num_keywords=5):
        """提取文本中的关键词"""
        # 这里使用简单的词频统计来提取关键词
        # 在实际应用中，可以使用更复杂的方法如TF-IDF
        
        try:
            tokens = TextProcessor.tokenize_text(text, language)
            
            # 过滤短词和非字母数字词
            filtered_tokens = [token.lower() for token in tokens if len(token) > 3 and token.isalnum()]
            
            # 计算词频
            word_freq = {}
            for token in filtered_tokens:
                word_freq[token] = word_freq.get(token, 0) + 1
            
            # 排序并返回前N个关键词
            sorted_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
            return [word for word, _ in sorted_keywords[:num_keywords]]
        
        except Exception as e:
            print(f"提取关键词过程发生错误: {e}")
            return []
    
    @staticmethod
    def get_text_summary(text, language=None, max_sentences=3):
        """生成文本摘要"""
        # 这里实现一个简单的抽取式摘要
        # 在实际应用中，可以使用更复杂的方法
        
        if not text:
            return ""
        
        # 尝试检测语言
        if not language:
            try:
                language = detect(text)
            except LangDetectException:
                language = 'en'  # 默认英语
        
        # 分句
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        if len(sentences) <= max_sentences:
            return text
        
        # 对于简单实现，我们只返回前几句
        return ' '.join(sentences[:max_sentences])


# 为了兼容现有代码，保留函数接口
def process_text(text, language=None):
    """兼容函数，调用TextProcessor类的同名方法"""
    return TextProcessor.process_text(text, language)