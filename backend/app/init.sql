
CREATE DATABASE IF NOT EXISTS news_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE news_system;

-- 然后执行创建表和插入数据的语句

-- 创建管理员用户
-- 清空表（注意外键约束顺序）
-- TRUNCATE TABLE news;
TRUNCATE TABLE crawler_configs;
TRUNCATE TABLE websites;
TRUNCATE TABLE users;

-- 或重置自增ID
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE websites AUTO_INCREMENT = 1;
ALTER TABLE crawler_configs AUTO_INCREMENT = 1;
-- ALTER TABLE news AUTO_INCREMENT = 1;


INSERT INTO users (username, email, password_hash, created_at) VALUES 
('admin', 'admin@example.com', '$2b$12$IKEQb00u5eHhkDSPw8UAeOaXR9z6WNurQmYsK9.wiqIUYj6aQpnUm', NOW()),
('editor', 'editor@example.com', '$2b$12$LQvHTBRMpnDQxvEkll3.KO1ctn0C9Ry4LqpwKzZ1DBNRjHk40ORZa', NOW()),
('analyst', 'analyst@example.com', '$2b$12$9lHRbA9cVJJrdWTgPwmyEuK24xn7MZ3yF7V9jN8YnmAfQpnrYUWpm', NOW());

-- 密码均为 'password123'

-- 创建网站源数据
INSERT INTO websites (name, url, language, country, description, logo_url, active) VALUES
('BBC News', 'https://www.bbc.com/news', 'en', 'UK', 'British Broadcasting Corporation News', 'https://example.com/logos/bbc.png', 1),
('CNN', 'https://www.cnn.com', 'en', 'USA', 'Cable News Network', 'https://example.com/logos/cnn.png', 1),
('新华网', 'http://www.xinhuanet.com', 'zh', 'China', '中国国家通讯社', 'https://example.com/logos/xinhua.png', 1),
('人民日报', 'http://www.people.com.cn', 'zh', 'China', '中国共产党中央委员会机关报', 'https://example.com/logos/people.png', 1),
('Le Monde', 'https://www.lemonde.fr', 'fr', 'France', 'French daily newspaper', 'https://example.com/logos/lemonde.png', 1),
('Deutsche Welle', 'https://www.dw.com', 'de', 'Germany', 'German international broadcaster', 'https://example.com/logos/dw.png', 1),
('Al Jazeera', 'https://www.aljazeera.com', 'ar', 'Qatar', 'Qatari news channel', 'https://example.com/logos/aljazeera.png', 1);

-- 创建爬虫配置数据
INSERT INTO crawler_configs (website_id, frequency, active, last_crawled, path_pattern, max_items, headers, parser_type) VALUES
(1, 3600, 1, NOW(), '/news/*', 50, '{"User-Agent": "Mozilla/5.0"}', 'html'),
(2, 7200, 1, NOW(), '/world/*', 30, '{"User-Agent": "Mozilla/5.0"}', 'html'),
(3, 3600, 1, NOW(), '/news/*', 50, '{"User-Agent": "Mozilla/5.0"}', 'html'),
(4, 7200, 1, NOW(), '/world/*', 40, '{"User-Agent": "Mozilla/5.0"}', 'html'),
(5, 14400, 1, NOW(), '/international/*', 30, '{"User-Agent": "Mozilla/5.0"}', 'html'),
(6, 10800, 0, '2025-03-22 10:00:00', '/en/top-stories/*', 25, '{"User-Agent": "Mozilla/5.0"}', 'html'),
(7, 21600, 1, NOW(), '/news/*', 20, '{"User-Agent": "Mozilla/5.0"}', 'html');

-- 创建英文新闻测试数据
-- INSERT INTO news (title, content, summary, language, country, source, url, published_date, vector_embedding) VALUES
-- ('Global Climate Agreement Reaches New Milestone', 'Over 190 countries signed the new climate accord today in Geneva, marking a historic step towards carbon neutrality. The agreement sets binding targets for emission reductions by 2035.', 'New global climate agreement signed with binding emission targets', 'en', 'International', 'BBC News', 'https://www.bbc.com/news/world-europe-123456', '2025-03-20 08:30:00', NULL),
-- ('Tech Companies Face New Regulations in EU Market', 'The European Union has passed new digital market regulations that will require major technology companies to change how they operate within the bloc. The new rules aim to limit market dominance and improve competition.', 'EU passes strict new technology company regulations', 'en', 'EU', 'CNN', 'https://www.cnn.com/2025/03/19/tech/eu-regulations/index.html', '2025-03-19 14:45:00', NULL),
-- ('Inflation Rates Drop Across Western Economies', 'Central banks report that inflation rates have decreased significantly over the past quarter, potentially signaling an end to recent economic volatility. Consumer prices rose at the slowest pace in three years.', 'Inflation falls to lowest level in three years', 'en', 'USA', 'CNN', 'https://www.cnn.com/2025/03/18/economy/inflation-drop/index.html', '2025-03-18 16:20:00', NULL);

-- 创建中文新闻测试数据
INSERT INTO news (title, content, summary, language, country, source, url, published_date, vector_embedding) VALUES
('中国启动新一轮科技创新计划', '中国政府今日宣布启动新一轮科技创新计划，投资5000亿元人民币发展人工智能、量子计算和生物技术等前沿领域。该计划预计将持续到2030年。', '中国启动新科技创新计划，投资5000亿元发展前沿技术', 'zh', 'China', '新华网', 'http://www.xinhuanet.com/tech/2025-03/22/c_1234567890.htm', '2025-03-22 09:15:00', NULL),
('亚洲经济一体化进程加速', '随着区域全面经济伙伴关系协定（RCEP）的全面实施，亚洲各国之间的贸易壁垒正在逐步消除，经济一体化进程明显加速。专家预测这将带来区域内贸易额的显著增长。', '亚洲经济一体化进程加速，区域内贸易额预计显著增长', 'zh', 'China', '人民日报', 'http://finance.people.com.cn/n1/2025/0321/c1004-12345678.html', '2025-03-21 11:30:00', NULL),
('全球新能源汽车市场份额突破30%', '据最新行业报告显示，全球新能源汽车市场份额首次突破30%，中国市场占据半壁江山。传统汽车制造商纷纷加速电动化转型。', '新能源汽车全球市场份额破30%，中国市场占主导地位', 'zh', 'China', '新华网', 'http://www.xinhuanet.com/auto/2025-03/20/c_1234567891.htm', '2025-03-20 14:00:00', NULL);

-- 创建法语新闻测试数据
INSERT INTO news (title, content, summary, language, country, source, url, published_date, vector_embedding) VALUES
('La France annonce un plan ambitieux pour l''énergie renouvelable', 'Le gouvernement français a dévoilé un plan de 45 milliards d''euros pour développer l''énergie éolienne et solaire. L''objectif est d''atteindre 60% d''électricité renouvelable d''ici 2035.', 'La France investit 45 milliards dans les énergies renouvelables', 'fr', 'France', 'Le Monde', 'https://www.lemonde.fr/economie/article/2025/03/22/france-plan-energie-renouvelable.html', '2025-03-22 10:45:00', NULL),
('Réforme du système éducatif: les enseignants manifestent', 'Des milliers d''enseignants ont manifesté à Paris contre la nouvelle réforme du système éducatif. Les syndicats dénoncent un manque de moyens et de concertation.', 'Manifestation massive des enseignants contre la réforme éducative', 'fr', 'France', 'Le Monde', 'https://www.lemonde.fr/societe/article/2025/03/19/manifestation-enseignants.html', '2025-03-19 18:30:00', NULL);

-- 创建德语新闻测试数据
INSERT INTO news (title, content, summary, language, country, source, url, published_date, vector_embedding) VALUES
('Deutschland erreicht Klimaziele für 2025 vorzeitig', 'Deutschland hat seine Treibhausgasemissionen stärker reduziert als erwartet und wird die für 2025 gesetzten Klimaziele voraussichtlich ein Jahr früher erreichen. Experten führen dies auf den Ausbau erneuerbarer Energien zurück.', 'Deutschland erreicht Klimaziele früher als geplant', 'de', 'Germany', 'Deutsche Welle', 'https://www.dw.com/de/klimaziele-deutschland/a-12345678', '2025-03-21 13:20:00', NULL),
('Neue Handelsabkommen zwischen EU und südamerikanischen Ländern', 'Die EU hat neue Handelsabkommen mit mehreren südamerikanischen Ländern unterzeichnet. Die Vereinbarungen sollen Zölle senken und den Handel mit Agrar- und Industrieprodukten fördern.', 'EU schließt Handelsabkommen mit südamerikanischen Ländern', 'de', 'Germany', 'Deutsche Welle', 'https://www.dw.com/de/eu-handelsabkommen/a-12345679', '2025-03-20 15:10:00', NULL);

-- 创建阿拉伯语新闻测试数据
INSERT INTO news (title, content, summary, language, country, source, url, published_date, vector_embedding) VALUES
('قمة اقتصادية في الرياض تناقش الاستثمارات المستقبلية', 'تستضيف العاصمة السعودية الرياض قمة اقتصادية كبرى تجمع قادة دول مجلس التعاون الخليجي لمناقشة خطط الاستثمار المستقبلية والتحول الاقتصادي في المنطقة.', 'قمة اقتصادية خليجية في الرياض لبحث الاستثمارات المستقبلية', 'ar', 'Saudi Arabia', 'Al Jazeera', 'https://www.aljazeera.net/news/2025/3/22/economic-summit', '2025-03-22 12:00:00', NULL);

