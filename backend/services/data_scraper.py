import json
import logging
import datetime
import random
from typing import List, Dict, Any, Optional
import time
import threading
from scrapy import Spider
from scrapy.http import Request
import os
import numpy as np  # 用于处理向量
from backend.app.models import Website, News  # 导入 Website 和 News 模型
from .sentence_embedding_service import SentenceEmbeddingService  # 导入句子嵌入服务

class NewsSpider(Spider):
    name = "news_spider"
    
    def __init__(self, country, *args, **kwargs):
        super(NewsSpider, self).__init__(*args, **kwargs)
        self.start_urls = self.get_start_urls(country)
        
        # 初始化句子嵌入服务
        try:
            # 使用句子嵌入服务替代直接使用模型
            self.embedding_service = SentenceEmbeddingService('paraphrase-MiniLM-L6-v2')
            logging.info("成功初始化句子嵌入服务")
        except Exception as e:
            logging.error(f"初始化句子嵌入服务失败: {str(e)}")
            self.embedding_service = None
    
    def get_start_urls(self, country):
        """
        根据国家返回起始URL列表
        
        Args:
            country: 国家名称或代码
            
        Returns:
            List[str]: URL列表
        """
        # 规范化国家名称
        country = country.lower().replace(' ', '_')
        
        # 国家对应的新闻网站URL
        country_urls = {
            "czech_republic": [
                "https://www.idnes.cz/",
                "https://www.novinky.cz/",
                "https://www.aktualne.cz/"
            ],
            "hungary": [
                "https://index.hu/",
                "https://24.hu/",
                "https://hvg.hu/"
            ],
            # 可以添加更多国家
        }
        
        # 返回国家对应的URL列表，如果不存在则返回空列表
        return country_urls.get(country, [])

    def parse(self, response):
        articles = response.css('article')
        for article in articles:
            content = article.css('p::text').getall()
            tfidf_value = self.calculate_vector(content)
            yield {
                'title': article.css('h2::text').get(),
                'link': article.css('a::attr(href)').get(),
                'date': article.css('time::attr(datetime)').get(),
                'content': content,
                'tfidf': tfidf_value
            }
        
        next_page = response.css('a.next::attr(href)').get()
        if (next_page):
            yield Request(url=next_page, callback=self.parse)

    def calculate_vector(self, content: List[str]) -> List[List[float]]:
        """
        使用SentenceEmbeddingService计算内容的向量表示
        
        Args:
            content: 文本内容列表
            
        Returns:
            List[List[float]]: 向量表示列表
        """
        if not content:
            return []
            
        if self.embedding_service:
            try:
                # 使用句子嵌入服务计算向量
                vectors = self.embedding_service.get_embeddings(content)
                # 如果返回的是numpy数组，则转换为Python列表
                if isinstance(vectors, np.ndarray):
                    return vectors.tolist()
                return vectors
            except Exception as e:
                logging.error(f"计算语义向量时出错: {str(e)}，将返回空向量")
                return [[0.0] * 10] * len(content)  # 返回空向量
        else:
            logging.warning("句子嵌入服务未初始化，返回空向量")
            return [[0.0] * 10] * len(content)  # 返回空向量

def run_spider(country):
    from scrapy.crawler import CrawlerProcess
    process = CrawlerProcess()
    process.crawl(NewsSpider, country=country)
    process.start()

class MockWebsite:
    """用于测试的模拟网站类"""
    def __init__(self, name, url):
        self.name = name
        self.url = url

class DataScraper:
    """
    数据抓取服务类，用于批量爬取各国新闻网站数据
    """
    def __init__(self, db=None, proxy_pool_url: str = None):
        self.db = db
        self.proxy_pool_url = proxy_pool_url
        self.proxy_enabled = False
        self.running = False
        self.scrape_thread = None
        self.logger = logging.getLogger(__name__)
        
        # 默认的爬取设置
        self.default_settings = {
            'interval': 3600,  # 默认每小时爬取一次
            'timeout': 30,     # 默认请求超时时间
            'max_retries': 3,  # 默认最大重试次数
        }
        
        # 支持的国家和对应的新闻网站
        self.supported_countries = {
            'czech_republic': [
                {'name': 'iDNES.cz', 'url': 'https://www.idnes.cz/'},
                {'name': 'Novinky.cz', 'url': 'https://www.novinky.cz/'},
                {'name': 'Aktuálně.cz', 'url': 'https://www.aktualne.cz/'}
            ],
            'hungary': [
                {'name': 'Index.hu', 'url': 'https://index.hu/'},
                {'name': '24.hu', 'url': 'https://24.hu/'},
                {'name': 'HVG', 'url': 'https://hvg.hu/'}
            ]
        }

    def enable_proxy(self, enable: bool = True) -> None:
        """启用或禁用代理池"""
        self.proxy_enabled = enable
        self.logger.info(f"代理状态设置为: {'启用' if enable else '禁用'}")
        
    def get_proxy(self) -> Optional[Dict[str, str]]:
        """从代理池获取一个代理"""
        if not self.proxy_enabled or not self.proxy_pool_url:
            return None
        
        # 这里应该实现从代理池获取代理的逻辑
        # 示例实现，实际使用需要替换为真实代理池API调用
        return {
            'http': f'http://127.0.0.1:20171',
            'https': f'http://127.0.0.1:20171'
        }
    
    def start_scraping(self, countries: List[str] = None, interval: int = None) -> bool:
        """
        开始数据抓取
        
        Args:
            countries: 要抓取的国家列表,如果为None则抓取所有支持的国家
            interval: 抓取间隔秒,如果为None则使用默认间隔
            
        Returns:
            bool: 是否成功启动抓取
        """
        if self.running:
            self.logger.warning("抓取任务已在运行中")
            return False
        
        self.running = True
        interval = interval or self.default_settings['interval']
        countries = countries or list(self.supported_countries.keys())
        
        self.logger.info(f"开始抓取任务，国家: {countries}, 间隔: {interval}秒")
        
        # 启动抓取线程
        self.scrape_thread = threading.Thread(
            target=self._scrape_task,
            args=(countries, interval),
            daemon=True
        )
        self.scrape_thread.start()
        return True
    
    def stop_scraping(self) -> bool:
        """停止数据抓取"""
        if not self.running:
            self.logger.warning("没有正在运行的抓取任务")
            return False
        
        self.running = False
        self.logger.info("抓取任务已停止")
        return True
    
    def _scrape_task(self, countries: List[str], interval: int) -> None:
        """抓取任务的内部实现"""
        while self.running:
            try:
                self.logger.info(f"开始新一轮抓取，国家: {countries}")
                start_time = time.time()
                
                # 遍历每个国家进行抓取
                for country in countries:
                    # 从数据库中获取该国家的所有新闻网站
                    websites = self._get_websites_by_country(country)
                    if not websites:
                        self.logger.warning(f"不支持的国家: {country}")
                        continue
                    
                    self.logger.info(f"开始抓取 {country} 的 {len(websites)} 个网站")
                    
                    # 抓取每个网站
                    for website in websites:
                        try:
                            self._scrape_website(website, country)
                        except Exception as e:
                            self.logger.error(f"抓取网站 {website.name} 出错: {str(e)}")
                
                # 计算完成时间和下一次抓取时间
                elapsed = time.time() - start_time
                sleep_time = max(interval - elapsed, 0)
                self.logger.info(f"抓取完成，耗时: {elapsed:.2f}秒, 等待 {sleep_time:.2f}秒后进行下一轮抓取")
                
                # 等待下一次抓取
                for _ in range(int(sleep_time)):
                    if not self.running:
                        break
                    time.sleep(1)
                    
            except Exception as e:
                self.logger.error(f"抓取任务出错: {str(e)}")
                # 即使出错也继续运行，等待下一次抓取
                time.sleep(interval)

    def _get_websites_by_country(self, country: str) -> List[Any]:
        """从数据库中获取指定国家的所有新闻网站，如果无法连接数据库则使用本地数据"""
        try:
            return Website.query.filter_by(country=country).all()
        except Exception as e:
            self.logger.warning(f"无法从数据库获取网站数据: {str(e)}，使用本地数据")
            # 使用本地存储的网站数据作为后备
            if country in self.supported_countries:
                return [MockWebsite(site['name'], site['url']) 
                        for site in self.supported_countries[country]]
            return []
    
    def _scrape_website(self, website: Website, country: str) -> Dict[str, Any]:
        """
        抓取单个网站的实际新闻数据
        
        Args:
            website: 网站信息，包含name和url
            country: 网站所属国家
            
        Returns:
            Dict[str, Any]: 抓取的新闻数据
        """
        import requests
        from bs4 import BeautifulSoup
        from .sentence_embedding_service import SentenceEmbeddingService
        
        self.logger.info(f"抓取网站: {website.name} ({website.url})")
        
        # 初始化句子嵌入服务
        embedding_service = SentenceEmbeddingService()
        
        # 获取代理（如果启用）
        proxy = self.get_proxy() if self.proxy_enabled else None
        
        try:
            # 设置请求头，模拟浏览器访问
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
            
            # 发送HTTP请求获取网页内容
            response = requests.get(
                website.url, 
                headers=headers, 
                proxies=proxy,
                timeout=self.default_settings['timeout']
            )
            response.raise_for_status()  # 如果请求不成功则抛出异常
            
            # 使用BeautifulSoup解析HTML
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 提取标题（根据网站结构可能需要调整选择器）
            title_element = soup.select_one('h1, .article-title, .entry-title, .post-title')
            title = title_element.text.strip() if title_element else f"来自 {website.name} 的新闻"
            
            # 提取正文内容（根据网站结构可能需要调整选择器）
            content_elements = soup.select('article p, .article-content p, .entry-content p, .post-content p')
            content = ' '.join([p.text.strip() for p in content_elements]) if content_elements else f"这是来自{website.name}的新闻内容。"
            
            # 如果内容太少，可能是没有正确提取，使用更通用的选择器
            if len(content) < 100:
                content_elements = soup.select('p')
                content = ' '.join([p.text.strip() for p in content_elements[:10]])  # 取前10段文字
            
            # 提取发布日期（根据网站结构可能需要调整选择器）
            date_element = soup.select_one('time, .date, .article-date, .post-date')
            published_text = date_element.get('datetime') if date_element and date_element.get('datetime') else date_element.text.strip() if date_element else None
            
            # 尝试解析日期，如果失败则使用当前时间
            try:
                from dateutil import parser as date_parser
                published_at = date_parser.parse(published_text) if published_text else datetime.datetime.now()
            except:
                published_at = datetime.datetime.now()
            
            # 使用SentenceEmbeddingService计算内容的向量表示
            embedding_vector = embedding_service.get_sentence_embedding(content[:1000])  # 限制内容长度，防止太长
            
            # 确保向量可以被JSON序列化
            if isinstance(embedding_vector, np.ndarray):
                embedding_vector = embedding_vector.tolist()
            
            # 抓取的新闻数据
            news_data = {
                'title': title,
                'content': content,
                'url': response.url,  # 使用最终URL（可能经过重定向）
                'published_at': published_at,
                'website_id': getattr(website, 'id', 1),  # 默认使用ID=1，防止空值
                'website_name': website.name,  # 这个字段将不会用于News模型
                'embedding_vector': json.dumps(embedding_vector),  # 将向量序列化为JSON字符串
                'country': country  # 这个字段将不会用于News模型
            }
            
            # 打印抓取结果摘要
            self.logger.info(f"成功抓取 {website.name} 文章: {title[:30]}...")
            self.logger.info(f"内容长度: {len(content)} 字符")
            self.logger.info(f"向量表示: {embedding_service.get_embeddings(content)}") 
            self.logger.info(f"发布时间: {published_at}")
            
            return news_data
            
        except Exception as e:
            self.logger.error(f"抓取 {website.name} 出错: {str(e)}")
            # 发生错误时返回一些基本数据，避免完全失败
            return {
                'title': f'无法抓取 - {website.name}',
                'content': f'抓取 {website.name} 时遇到错误: {str(e)}',
                'url': website.url,
                'published_at': datetime.datetime.now(),
                'website_id': getattr(website, 'id', 1),
                'website_name': website.name,
                'embedding_vector': json.dumps(embedding_service.get_sentence_embedding(f"抓取错误 {website.name}").tolist()),
                'country': country
            }

    def get_scraping_status(self) -> Dict[str, Any]:
        """获取当前抓取状态"""
        return {
            'running': self.running,
            'proxy_enabled': self.proxy_enabled,
            'supported_countries': list(self.supported_countries.keys())
        }

    def test_scraping(self, country: str) -> None:
        """
        测试抓取功能，并将抓取到的数据插入到 News 表中
        
        Args:
            country: 要测试抓取的国家
        """
        self.logger.info(f"开始测试抓取国家: {country}")
        websites = self._get_websites_by_country(country)
        if not websites:
            self.logger.warning(f"不支持的国家: {country}")
            return
        
        news_list = []
        for website in websites:
            try:
                news_data = self._scrape_website(website, country)
                news_list.append(news_data)
            except Exception as e:
                self.logger.error(f"抓取网站 {website.name} 出错: {str(e)}")
        
        # 尝试将抓取的数据插入 News 表中
        try:
            if self.db:
                # 检查数据库表结构，确认embedding_vector字段是否存在
                try:
                    from sqlalchemy import inspect
                    inspector = inspect(self.db.session.get_bind())
                    columns = [column['name'] for column in inspector.get_columns('news')]
                    has_embedding = 'embedding_vector' in columns
                    self.logger.info(f"检测到news表字段: {columns}")
                except Exception as e:
                    self.logger.warning(f"无法检测数据库表结构: {str(e)}")
                    has_embedding = False
                
                for news_data in news_list:
                    # 创建基本News对象
                    news_data_dict = {
                        'title': news_data['title'],
                        'content': news_data['content'],
                        'url': news_data['url'],
                        'published_at': news_data['published_at'],
                        'website_id': news_data['website_id']
                    }
                    
                    # 如果有embedding_vector字段则添加
                    if has_embedding and 'embedding_vector' in news_data:
                        news_data_dict['embedding_vector'] = news_data['embedding_vector']
                    
                    news = News(**news_data_dict)
                    self.db.session.add(news)
                
                try:
                    self.db.session.commit()
                    self.logger.info(f"成功将 {len(news_list)} 条新闻数据插入到 News 表中")
                except Exception as commit_error:
                    self.logger.error(f"提交事务失败: {str(commit_error)}")
                    self.db.session.rollback()
                    raise
            else:
                self.logger.info(f"无数据库连接，跳过数据插入，共抓取 {len(news_list)} 条新闻数据")
                for i, news in enumerate(news_list):
                    self.logger.info(f"新闻 {i+1}: {news['title']}")
        except Exception as e:
            self.logger.error(f"插入新闻数据到数据库时出错: {str(e)}")
            # 确保回滚会话
            if self.db & hasattr(self.db, 'session'):
                self.db.session.rollback()
        
        self.logger.info(f"完成测试抓取国家: {country}")

def test_vector_calculation():
    """测试句子嵌入计算功能"""
    logger = logging.getLogger(__name__)
    logger.info("开始测试句子嵌入计算功能")
    
    # 创建NewsSpider实例
    spider = NewsSpider(country="test")
    
    # 准备测试数据
    test_docs = [
        "这是第一篇文档，包含了一些常见词汇",
        "第二篇文档有一些不同的词汇",
        "第三篇文档和第一篇有一些相同的词汇",
        "这是完全不同的内容，包含了其他文档中没有的独特词汇"
    ]
    
    # 计算嵌入向量
    try:
        embedding_results = spider.calculate_vector(test_docs)
        logger.info(f"成功计算向量表示，结果维度: {len(embedding_results)}x{len(embedding_results[0]) if embedding_results else 0}")
        
        # 输出部分结果
        for i, embedding in enumerate(embedding_results):
            # 只显示向量的前5个值
            logger.info(f"文档 {i+1} 向量表示 (前5个): {embedding[:5]}")
            
        # 如果有嵌入服务，计算相似度示例
        if hasattr(spider, 'embedding_service') and spider.embedding_service:
            try:
                # 使用服务的相似度计算方法
                similarity = spider.embedding_service.compute_similarity(test_docs[0], test_docs[2])
                logger.info(f"文档1和文档3的余弦相似度: {similarity:.4f}")
                
                # 测试语义搜索
                query = test_docs[0]
                search_results = spider.embedding_service.semantic_search(query, test_docs[1:], top_k=2)
                logger.info(f"查询: '{query}'")
                logger.info(f"搜索结果: {search_results}")
            except Exception as e:
                logger.error(f"计算相似度时出错: {str(e)}")
            
        logger.info("向量计算测试成功")
        return True
    except Exception as e:
        logger.error(f"向量计算测试失败: {str(e)}")
        return False

# 注意：直接运行此脚本时将尝试连接系统MySQL数据库
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    # 首先测试vector计算功能
    # test_vector_calculation()
    
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker, scoped_session
        
        # 尝试从环境变量或配置文件读取数据库配置
        db_host = os.environ.get('DB_HOST', 'localhost')
        db_port = os.environ.get('DB_PORT', '3306')
        db_user = os.environ.get('DB_USER', 'robin')
        db_pass = os.environ.get('DB_PASS', 'Robin123')
        db_name = os.environ.get('DB_NAME', 'big_data_analysis')
        
        # 打印诊断信息
        logger.info(f"数据库连接信息: host={db_host}, port={db_port}, user={db_user}, database={db_name}")
        
        # 构建连接URL
        db_url = f"mysql+pymysql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
        
        # 创建引擎和会话
        engine = create_engine(db_url)
        session_factory = sessionmaker(bind=engine)
        Session = scoped_session(session_factory)
        
        class SimpleDB:
            def __init__(self):
                self.session = Session()
            
            def commit(self):
                self.session.commit()
        
        # 测试连接
        conn = engine.connect()
        conn.close()
        logger.info("成功连接到数据库")
        
        # 使用数据库
        db = SimpleDB()
        scraper = DataScraper(db=db)
        logger.info("爬虫已初始化，开始测试抓取...")
        # scraper.test_scraping("czech_republic")
        scraper.test_scraping("hungary")
        
    except Exception as e:
        logger.error(f"手动连接数据库失败，错误详情: {str(e)}")
        logger.error("请检查以下可能的原因:")
        logger.error("1. 数据库服务器是否运行")
        logger.error("2. 数据库连接信息是否正确")
        logger.error("3. 数据库用户是否有足够权限")
        logger.error("4. 网络连接是否正常")
        logger.error("5. 是否安装了必要的数据库驱动")
        
        logger.info("以无数据库模式运行测试...")
        scraper = DataScraper()
        scraper.test_scraping("czech_republic")
        scraper.test_scraping("hungary")

