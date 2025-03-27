import pytest
import json
from unittest.mock import patch, MagicMock
from flask import Flask
import sys
import os

# 添加项目根目录到路径以便导入
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
sys.path.insert(0, project_root)
sys.path.insert(0, os.path.join(project_root, 'backend'))

from app.api.crawler import crawler_bp

@pytest.fixture
def app():
    """创建用于测试的Flask应用程序"""
    app = Flask(__name__)
    app.register_blueprint(crawler_bp, url_prefix='/crawler')
    app.config['TESTING'] = True
    return app

@pytest.fixture
def client(app):
    """创建应用程序的测试客户端"""
    return app.test_client()

class TestCrawler:
    """爬虫功能的测试套件"""
    
    def test_start_crawl_no_urls(self, client):
        """测试在没有提供URL时启动爬虫"""
        # 测试空JSON
        response = client.post('/crawler/start_crawl', json={})
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert data['error'] == 'No URLs provided'
        
        # 测试空URL列表
        response = client.post('/crawler/start_crawl', json={'urls': []})
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert data['error'] == 'No URLs provided'

    @patch('app.api.crawler.CrawlerProcess')
    def test_start_crawl_with_urls(self, MockCrawlerProcess, client):
        """测试使用有效URL启动爬虫"""
        # 创建模拟进程
        mock_process = MagicMock()
        MockCrawlerProcess.return_value = mock_process
        
        # 使用单个URL进行测试
        test_urls = ['https://example.com']
        response = client.post('/crawler/start_crawl', json={'urls': test_urls})
        
        # 验证爬虫是否使用正确的参数调用
        MockCrawlerProcess.assert_called_once()
        mock_process.crawl.assert_called_once()
        # 验证URL是否传递给了爬虫
        _, kwargs = mock_process.crawl.call_args
        assert kwargs['start_urls'] == test_urls
        
        # 验证是否调用了process.start
        mock_process.start.assert_called_once()
        
        # 检查响应
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Crawling started'

    @patch('app.api.crawler.CrawlerProcess')
    def test_start_crawl_multiple_urls(self, MockCrawlerProcess, client):
        """测试使用多个URL启动爬虫"""
        # 创建模拟进程
        mock_process = MagicMock()
        MockCrawlerProcess.return_value = mock_process
        
        # 使用多个URL进行测试
        test_urls = [
            'https://example.com',
            'https://example.org',
            'https://example.net'
        ]
        response = client.post('/crawler/start_crawl', json={'urls': test_urls})
        
        # 验证是否传递了正确的URL
        _, kwargs = mock_process.crawl.call_args
        assert kwargs['start_urls'] == test_urls
        assert len(kwargs['start_urls']) == 3
        
        # 检查响应
        assert response.status_code == 200

    @patch('app.api.crawler.CrawlerProcess')
    @patch('app.api.crawler.get_project_settings')
    def test_start_crawl_uses_project_settings(self, mock_get_settings, MockCrawlerProcess, client):
        """测试爬虫是否使用项目设置"""
        # 设置模拟设置和进程
        mock_settings = {'SOME_SETTING': 'test_value'}
        mock_get_settings.return_value = mock_settings
        mock_process = MagicMock()
        MockCrawlerProcess.return_value = mock_process
        
        # 发送请求
        test_urls = ['https://example.com']
        response = client.post('/crawler/start_crawl', json={'urls': test_urls})
        
        # 验证设置被检索和使用
        mock_get_settings.assert_called_once()
        MockCrawlerProcess.assert_called_once_with(mock_settings)
        
        # 检查响应
        assert response.status_code == 200

    @patch('app.api.crawler.CrawlerProcess')
    def test_start_crawl_error_handling(self, MockCrawlerProcess, client):
        """测试爬虫启动过程中的错误处理"""
        # 设置模拟以引发异常
        mock_process = MagicMock()
        mock_process.start.side_effect = Exception("Crawler error")
        MockCrawlerProcess.return_value = mock_process
        
        # 发送请求
        test_urls = ['https://example.com']
        with pytest.raises(Exception, match="Crawler error"):
            client.post('/crawler/start_crawl', json={'urls': test_urls})
        
        # 验证爬虫仍然正确设置
        mock_process.crawl.assert_called_once()

    def test_start_crawl_invalid_json(self, client):
        """测试使用无效JSON启动爬虫"""
        # 在请求中发送无效的JSON
        response = client.post(
            '/crawler/start_crawl', 
            data="This is not JSON",
            content_type='application/json'
        )
        
        # 应返回400 Bad Request
        assert response.status_code == 400