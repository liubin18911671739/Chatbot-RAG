from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .website import Website
from .news import News
from .user import User
from .crawler_config import CrawlerConfig

__all__ = ['User', 'News', 'CrawlerConfig']