from app.models import db

class CrawlerConfig(db.Model):
    __tablename__ = 'crawler_config'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    url = db.Column(db.String, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    crawl_interval = db.Column(db.Integer, nullable=False)
    last_crawled = db.Column(db.String)

    def __repr__(self):
        return f"<CrawlerConfig(id={self.id}, url='{self.url}', is_active={self.is_active}, crawl_interval={self.crawl_interval}, last_crawled='{self.last_crawled}')>"