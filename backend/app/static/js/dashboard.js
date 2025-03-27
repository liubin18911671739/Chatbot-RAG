/* filepath: f:\project\multilingual-news-system\backend\app\static\js\dashboard.js */
/**
 * 区域国别大数据分析系统 - 仪表盘交互脚本
 */

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('仪表盘页面已加载');
    
    // 初始化事件监听器
    initEventListeners();
    
    // 获取最新数据
    fetchDashboardData();
    
    // 设置数据自动刷新 (每60秒)
    setInterval(fetchDashboardData, 60000);
});

/**
 * 初始化事件监听器
 */
function initEventListeners() {
    // 刷新按钮点击事件
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            // 显示加载效果
            this.innerHTML = '<i class="bi bi-arrow-repeat"></i> 加载中...';
            this.disabled = true;
            
            // 获取最新数据
            fetchDashboardData().then(() => {
                // 恢复按钮状态
                this.innerHTML = '<i class="bi bi-arrow-clockwise"></i> 刷新数据';
                this.disabled = false;
            });
        });
    }
    
    // 日期范围选择器变化事件
    const dateRangeDropdown = document.querySelector('.dropdown-menu');
    if (dateRangeDropdown) {
        const dropdownItems = dateRangeDropdown.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const selectedRange = this.textContent;
                document.querySelector('.dropdown-toggle').innerHTML = `<i class="bi bi-calendar3"></i> ${selectedRange}`;
                
                // 根据所选日期范围更新数据
                fetchDashboardData(getDateRangeParams(selectedRange));
            });
        });
    }
    
    // 新闻搜索功能
    const newsSearch = document.getElementById('news-search');
    if (newsSearch) {
        newsSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const tableRows = document.querySelectorAll('#news-table-body tr');
            
            tableRows.forEach(row => {
                const title = row.querySelector('td:first-child').textContent.toLowerCase();
                const source = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || source.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
}

/**
 * 获取仪表盘数据
 */
function fetchDashboardData(dateRange = {}) {
    console.log('正在获取最新数据...');
    
    // 在实际应用中，这里应该是一个API请求
    // 现在我们用模拟数据演示
    return new Promise((resolve) => {
        setTimeout(() => {
            updateDashboardStats(generateMockData());
            updateCharts();
            resolve();
        }, 500);
    });
}

/**
 * 生成模拟数据
 */
function generateMockData() {
    return {
        newsCount: Math.floor(12000 + Math.random() * 1000),
        newToday: Math.floor(300 + Math.random() * 100),
        crawlerStatus: Math.random() > 0.1 ? 'active' : 'inactive',
        lastActivity: '3分钟前',
        activeSources: Math.floor(20 + Math.random() * 5),
        offlineSources: Math.floor(1 + Math.random() * 3),
        systemLoad: Math.floor(30 + Math.random() * 30),
        memoryUsage: (2 + Math.random()).toFixed(1),
        trendData: [320, 280, 350, 290, 410, 360, 342].map(val => 
            Math.floor(val * (0.9 + Math.random() * 0.2))
        ),
        distributionData: [45, 30, 10, 8, 5, 2]
    };
}

/**
 * 更新仪表盘统计数据
 */
function updateDashboardStats(data) {
    // 更新顶部卡片数据
    updateElement('news-count', data.newsCount.toLocaleString());
    
    // 更新爬虫状态
    const statusElement = document.querySelector('.card-body h3.text-success');
    if (statusElement) {
        statusElement.textContent = data.crawlerStatus === 'active' ? '运行中' : '已停止';
        statusElement.className = data.crawlerStatus === 'active' ? 'text-success fw-bold' : 'text-danger fw-bold';
    }
    
    // 更新系统负载
    const loadElement = document.querySelector('.card-body h3.fw-bold:nth-child(1)');
    if (loadElement) {
        loadElement.textContent = `${data.systemLoad}%`;
    }
    
    // 更新进度条
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.style.width = `${data.systemLoad}%`;
    }
    
    // 更新内存使用
    const memoryElement = document.querySelector('.card-text.small.mt-2.mb-0');
    if (memoryElement) {
        memoryElement.textContent = `内存使用: ${data.memoryUsage}GB / 4GB`;
    }
}

/**
 * 更新图表
 */
function updateCharts() {
    // 更新新闻趋势图表
    if (typeof trendChart !== 'undefined') {
        const newData = generateMockData().trendData;
        trendChart.data.datasets[0].data = newData;
        trendChart.update();
    }
    
    // 分布图不需要频繁更新
}

/**
 * 根据日期范围选择返回相应的参数
 */
function getDateRangeParams(rangeText) {
    const now = new Date();
    let startDate = new Date();
    
    switch(rangeText) {
        case '今天':
            startDate.setHours(0, 0, 0, 0);
            break;
        case '最近7天':
            startDate.setDate(now.getDate() - 7);
            break;
        case '最近30天':
            startDate.setDate(now.getDate() - 30);
            break;
        case '本月':
            startDate.setDate(1);
            break;
        default:
            startDate.setDate(now.getDate() - 30);
    }
    
    return {
        start_date: startDate.toISOString().split('T')[0],
        end_date: now.toISOString().split('T')[0]
    };
}

/**
 * 更新DOM元素内容
 */
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

/**
 * 使用现有图表实例更新数据
 * 如果图表实例不存在，此函数将创建新实例
 */
function initOrUpdateCharts() {
    // 检查图表对象是否已经初始化
    if (typeof trendChart === 'undefined' && document.getElementById('news-trend-chart')) {
        initNewsCollectionTrendChart();
    }
    
    if (typeof distributionChart === 'undefined' && document.getElementById('content-distribution-chart')) {
        initContentDistributionChart();
    }
}

/**
 * 初始化新闻收集趋势图表
 */
function initNewsCollectionTrendChart() {
    const trendCtx = document.getElementById('news-trend-chart').getContext('2d');
    trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: ['3/17', '3/18', '3/19', '3/20', '3/21', '3/22', '3/23'],
            datasets: [{
                label: '抓取数量',
                data: generateMockData().trendData,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                tension: 0.2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                }
            }
        }
    });
}

/**
 * 初始化内容分布饼图
 */
function initContentDistributionChart() {
    const distributionCtx = document.getElementById('content-distribution-chart').getContext('2d');
    distributionChart = new Chart(distributionCtx, {
        type: 'doughnut',
        data: {
            labels: ['中文', '英文', '法文', '德文', '西班牙文', '其他'],
            datasets: [{
                data: generateMockData().distributionData,
                backgroundColor: [
                    '#0d6efd', '#6f42c1', '#fd7e14', '#20c997', '#ffc107', '#adb5bd'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 15,
                        padding: 15
                    }
                }
            },
            cutout: '60%'
        }
    });
}