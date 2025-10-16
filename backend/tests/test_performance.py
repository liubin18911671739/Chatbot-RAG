"""
Performance and load tests for the system.
"""
import pytest
import time
from concurrent.futures import ThreadPoolExecutor, as_completed


class TestPerformance:
    """Test system performance under various conditions."""
    
    def test_api_response_time(self, client, init_database):
        """Test API response time for basic endpoints."""
        endpoints = [
            '/scenes',
            '/questions',
            '/greeting'
        ]
        
        for endpoint in endpoints:
            start_time = time.time()
            response = client.get(endpoint)
            end_time = time.time()
            
            response_time = end_time - start_time
            
            assert response.status_code == 200
            assert response_time < 1.0, f"{endpoint} took {response_time}s"
    
    def test_chat_response_time(self, client, auth_headers):
        """Test chat response time."""
        start_time = time.time()
        response = client.post('/chat',
            headers=auth_headers,
            json={'message': '你好'}
        )
        end_time = time.time()
        
        response_time = end_time - start_time
        
        assert response.status_code == 200
        assert response_time < 5.0, f"Chat response took {response_time}s"
    
    def test_search_performance(self, client, init_database):
        """Test search performance with various queries."""
        queries = ['中国', '社会主义', '学习', '新时代']
        
        for query in queries:
            start_time = time.time()
            response = client.get(f'/search?q={query}')
            end_time = time.time()
            
            response_time = end_time - start_time
            
            assert response.status_code == 200
            assert response_time < 2.0, f"Search for '{query}' took {response_time}s"
    
    def test_concurrent_requests(self, client, init_database):
        """Test system under concurrent load."""
        def make_request():
            response = client.get('/scenes')
            return response.status_code
        
        num_requests = 50
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(num_requests)]
            results = [future.result() for future in as_completed(futures)]
        
        # All requests should succeed
        assert all(status == 200 for status in results)
    
    def test_database_query_performance(self, client, init_database):
        """Test database query performance."""
        start_time = time.time()
        response = client.get('/questions')
        end_time = time.time()
        
        query_time = end_time - start_time
        
        assert response.status_code == 200
        assert query_time < 1.0, f"Database query took {query_time}s"
    
    def test_large_chat_context(self, client, auth_headers):
        """Test chat with large context."""
        large_context = [
            {'role': 'user', 'content': f'消息 {i}'}
            for i in range(50)
        ]
        
        start_time = time.time()
        response = client.post('/chat',
            headers=auth_headers,
            json={
                'message': '继续讨论',
                'context': large_context
            }
        )
        end_time = time.time()
        
        response_time = end_time - start_time
        
        assert response.status_code == 200
        assert response_time < 10.0, f"Large context chat took {response_time}s"


class TestLoadTesting:
    """Load testing scenarios."""
    
    def test_sustained_load(self, client, auth_headers):
        """Test system under sustained load."""
        duration = 10  # seconds
        request_count = 0
        start_time = time.time()
        
        while time.time() - start_time < duration:
            response = client.get('/scenes')
            if response.status_code == 200:
                request_count += 1
        
        requests_per_second = request_count / duration
        
        # Should handle at least 10 requests per second
        assert requests_per_second >= 10
    
    def test_stress_test_chat(self, client, auth_headers):
        """Stress test the chat endpoint."""
        messages = [
            '你好',
            '什么是社会主义?',
            '请详细说明',
            '谢谢'
        ]
        
        successful_requests = 0
        
        for message in messages * 5:  # Send each message 5 times
            response = client.post('/chat',
                headers=auth_headers,
                json={'message': message}
            )
            if response.status_code == 200:
                successful_requests += 1
        
        # At least 90% success rate
        success_rate = successful_requests / (len(messages) * 5)
        assert success_rate >= 0.9
