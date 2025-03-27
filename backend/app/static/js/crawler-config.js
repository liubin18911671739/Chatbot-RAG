/* filepath: f:\project\multilingual-news-system\backend\app\static\js\crawler-config.js */
/**
 * 区域国别大数据分析系统 - 爬虫配置页面交互脚本
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('爬虫配置页面已加载');
    
    // 初始化表单验证
    initFormValidation();
    
    // 初始化爬虫操作事件
    initCrawlerOperations();
    
    // 初始化搜索过滤功能
    initSearchFilter();
    
    // 初始化多选框功能
    initMultiSelect();
    
    // 初始化测试连接功能
    initTestConnection();
});

/**
 * 初始化表单验证
 */
function initFormValidation() {
    // 验证新爬虫表单
    const newCrawlerForm = document.querySelector('#newCrawlerModal form');
    if (newCrawlerForm) {
        newCrawlerForm.addEventListener('submit', function(event) {
            if (!this.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            this.classList.add('was-validated');
            
            // 验证JSON格式
            const selectorsField = document.getElementById('selectors');
            if (selectorsField && selectorsField.value) {
                try {
                    JSON.parse(selectorsField.value);
                    selectorsField.setCustomValidity('');
                } catch (e) {
                    selectorsField.setCustomValidity('请输入有效的JSON格式');
                    event.preventDefault();
                }
            }
        });
    }
    
    // 验证编辑爬虫表单
    const editCrawlerForm = document.querySelector('#editCrawlerModal form');
    if (editCrawlerForm) {
        editCrawlerForm.addEventListener('submit', function(event) {
            if (!this.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            this.classList.add('was-validated');
            
            // 验证JSON格式
            const selectorsField = document.getElementById('edit_selectors');
            if (selectorsField && selectorsField.value) {
                try {
                    JSON.parse(selectorsField.value);
                    selectorsField.setCustomValidity('');
                } catch (e) {
                    selectorsField.setCustomValidity('请输入有效的JSON格式');
                    event.preventDefault();
                }
            }
        });
    }
    
    // 验证系统设置表单
    const systemSettingsForm = document.getElementById('system-settings-form');
    if (systemSettingsForm) {
        systemSettingsForm.addEventListener('submit', function(event) {
            if (!this.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            this.classList.add('was-validated');
        });
    }
}

/**
 * 初始化爬虫操作事件
 */
function initCrawlerOperations() {
    // 编辑爬虫 - 加载爬虫数据
    const editButtons = document.querySelectorAll('.edit-crawler');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const crawlerId = this.getAttribute('data-id');
            fetchCrawlerDetails(crawlerId);
        });
    });
    
    // 运行爬虫
    const runButtons = document.querySelectorAll('.run-crawler');
    runButtons.forEach(button => {
        button.addEventListener('click', function() {
            const crawlerId = this.getAttribute('data-id');
            runCrawler(crawlerId);
        });
    });
    
    // 设置删除确认按钮的数据ID
    const deleteButtons = document.querySelectorAll('.delete-crawler');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const crawlerId = this.getAttribute('data-id');
            document.getElementById('confirm-delete').setAttribute('data-id', crawlerId);
        });
    });
    
    // 确认删除
    const deleteButton = document.getElementById('confirm-delete');
    if (deleteButton) {
        deleteButton.addEventListener('click', function() {
            const crawlerId = this.getAttribute('data-id');
            deleteCrawler(crawlerId);
        });
    }
    
    // 系统设置表单提交
    const settingsForm = document.getElementById('system-settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(event) {
            event.preventDefault();
            saveSystemSettings(new FormData(this));
        });
    }
}

/**
 * 初始化搜索过滤功能
 */
function initSearchFilter() {
    const searchInput = document.getElementById('crawler-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const tableRows = document.querySelectorAll('tbody tr');
            
            tableRows.forEach(row => {
                const name = row.querySelector('td:first-child').textContent.toLowerCase();
                const url = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                
                if (name.includes(searchTerm) || url.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
}

/**
 * 初始化多选框功能
 */
function initMultiSelect() {
    // 提供更好的多选框用户体验
    const multiSelects = document.querySelectorAll('select[multiple]');
    multiSelects.forEach(select => {
        select.addEventListener('mousedown', function(e){
            if(e.ctrlKey) {
                e.preventDefault();
                const option = e.target;
                if (option.tagName === 'OPTION') {
                    option.selected = !option.selected;
                }
            }
        });
    });
}

/**
 * 初始化测试连接功能
 */
function initTestConnection() {
    // 添加测试连接按钮
    const testButton = document.createElement('button');
    testButton.type = 'button';
    testButton.className = 'btn btn-outline-info mt-1';
    testButton.innerText = '测试连接';
    testButton.id = 'test-connection';
    
    // 获取基础URL输入框
    const baseUrlField = document.getElementById('base_url');
    if (baseUrlField) {
        // 插入测试按钮
        baseUrlField.parentNode.appendChild(testButton);
        
        // 添加点击事件
        testButton.addEventListener('click', function() {
            const url = baseUrlField.value;
            if (url) {
                testCrawlerConnection(url);
            } else {
                showAlert('请先输入目标网站URL', 'warning');
            }
        });
    }
    
    // 编辑模态框中也添加测试按钮
    const editBaseUrlField = document.getElementById('edit_base_url');
    if (editBaseUrlField) {
        const editTestButton = testButton.cloneNode(true);
        editTestButton.id = 'edit-test-connection';
        editBaseUrlField.parentNode.appendChild(editTestButton);
        
        editTestButton.addEventListener('click', function() {
            const url = editBaseUrlField.value;
            if (url) {
                testCrawlerConnection(url);
            } else {
                showAlert('请先输入目标网站URL', 'warning');
            }
        });
    }
}

/**
 * 获取爬虫详情
 */
function fetchCrawlerDetails(crawlerId) {
    console.log(`获取爬虫ID ${crawlerId} 的详情`);
    
    // 显示加载提示
    showSpinner(true);
    
    // 在实际应用中应该发送API请求获取爬虫详情
    // 这里使用模拟数据
    
    // 模拟API请求延迟
    setTimeout(() => {
        // 填充编辑表单
        document.getElementById('edit_id').value = crawlerId;
        document.getElementById('edit_name').value = `爬虫 ${crawlerId}`;
        document.getElementById('edit_base_url').value = 'https://example.com';
        
        // 模拟获取其他字段的数据
        // 这里是示例数据，实际应从API获取
        if (document.getElementById('edit_frequency')) {
            document.getElementById('edit_frequency').value = 60;
        }
        if (document.getElementById('edit_selectors')) {
            document.getElementById('edit_selectors').value = '{"article": "div.news-item", "title": "h3.title", "content": "div.content"}';
        }
        if (document.getElementById('edit_max_pages')) {
            document.getElementById('edit_max_pages').value = 5;
        }
        if (document.getElementById('edit_max_articles')) {
            document.getElementById('edit_max_articles').value = 100;
        }
        if (document.getElementById('edit_active')) {
            document.getElementById('edit_active').checked = true;
        }
        
        // 隐藏加载提示
        showSpinner(false);
        
        console.log(`爬虫 ${crawlerId} 的详情已加载`);
    }, 500);
}

/**
 * 运行爬虫
 */
function runCrawler(crawlerId) {
    console.log(`启动爬虫 ${crawlerId}`);
    
    // 显示加载状态
    const button = document.querySelector(`.run-crawler[data-id="${crawlerId}"]`);
    if (button) {
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="bi bi-hourglass-split"></i>';
        button.disabled = true;
        
        // 实际应用中，这里应该发送API请求启动爬虫
        // 模拟API请求
        fetch(`/api/crawler/run/${crawlerId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            // 模拟响应
            return { status: 'success', message: '爬虫任务已成功启动' };
        })
        .then(data => {
            // 恢复按钮状态
            button.innerHTML = originalHTML;
            button.disabled = false;
            
            // 显示成功消息
            showAlert(data.message, 'success');
        })
        .catch(error => {
            // 恢复按钮状态
            button.innerHTML = originalHTML;
            button.disabled = false;
            
            // 显示错误消息
            showAlert('启动爬虫失败：' + error.message, 'danger');
        });
    }
}

/**
 * 删除爬虫
 */
function deleteCrawler(crawlerId) {
    console.log(`删除爬虫 ${crawlerId}`);
    
    // 隐藏模态框
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteCrawlerModal'));
    if (modal) {
        modal.hide();
    }
    
    // 显示加载提示
    showSpinner(true);
    
    // 在实际应用中应该发送API请求删除爬虫
    // 这里使用模拟操作
    setTimeout(() => {
        // 从DOM中移除爬虫行
        const row = document.querySelector(`tr[data-crawler-id="${crawlerId}"]`);
        if (row) {
            row.remove();
        }
        
        // 隐藏加载提示
        showSpinner(false);
        
        // 显示成功消息
        showAlert('爬虫配置已成功删除', 'success');
        
        // 更新统计数字
        updateCrawlerStats();
    }, 800);
}

/**
 * 保存系统设置
 */
function saveSystemSettings(formData) {
    console.log('保存系统设置');
    
    // 显示加载提示
    showSpinner(true);
    
    // 将FormData转换为对象
    const settings = {};
    for (const [key, value] of formData.entries()) {
        settings[key] = value;
    }
    
    console.log('系统设置:', settings);
    
    // 在实际应用中应该发送API请求保存设置
    // 这里使用模拟操作
    setTimeout(() => {
        // 隐藏加载提示
        showSpinner(false);
        
        // 显示成功消息
        showAlert('系统设置已保存', 'success');
    }, 800);
}

/**
 * 测试爬虫连接
 */
function testCrawlerConnection(url) {
    console.log(`测试连接: ${url}`);
    
    // 创建加载指示器
    const testButton = document.activeElement;
    const originalText = testButton.innerText;
    testButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 测试中...';
    testButton.disabled = true;
    
    // 在实际应用中应该发送API请求测试连接
    // 这里使用模拟操作
    setTimeout(() => {
        // 随机模拟成功或失败
        const success = Math.random() > 0.3;
        
        // 恢复按钮状态
        testButton.innerText = originalText;
        testButton.disabled = false;
        
        if (success) {
            // 显示成功消息
            showAlert(`成功连接到 ${url}，网站可访问`, 'success');
        } else {
            // 显示错误消息
            showAlert(`无法连接到 ${url}，请检查URL或网络设置`, 'danger');
        }
    }, 1500);
}

/**
 * 更新爬虫统计信息
 */
function updateCrawlerStats() {
    // 获取表格中的行数
    const rows = document.querySelectorAll('tbody tr:not([style*="display: none"])');
    const totalCount = rows.length;
    
    // 获取活跃爬虫数量
    const activeCount = document.querySelectorAll('tbody tr:not([style*="display: none"]) .badge.bg-success').length;
    
    // 更新统计卡片
    const totalElement = document.querySelector('.card-body h3.fw-bold:nth-of-type(1)');
    if (totalElement) {
        totalElement.textContent = totalCount;
    }
    
    const activeElement = document.querySelector('.card-body h3.fw-bold:nth-of-type(2)');
    if (activeElement) {
        activeElement.textContent = activeCount;
    }
}

/**
 * 显示/隐藏加载提示
 */
function showSpinner(show) {
    let spinner = document.getElementById('global-spinner');
    
    // 如果不存在，创建一个
    if (!spinner && show) {
        spinner = document.createElement('div');
        spinner.id = 'global-spinner';
        spinner.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-25';
        spinner.style.zIndex = '9999';
        spinner.innerHTML = `
            <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">加载中...</span>
            </div>
        `;
        document.body.appendChild(spinner);
    } 
    // 如果存在且需要隐藏，移除它
    else if (spinner && !show) {
        spinner.remove();
    }
}

/**
 * 显示提示消息
 */
function showAlert(message, type = 'info') {
    // 创建提示元素
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.style.zIndex = '9999';
    alertDiv.style.maxWidth = '90%';
    alertDiv.style.width = '500px';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // 添加到页面
    document.body.appendChild(alertDiv);
    
    // 自动关闭
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertDiv);
        bsAlert.close();
    }, 3000);
}

// 页面加载完成后，注册一些额外的事件处理器
window.addEventListener('load', function() {
    // 当模态框隐藏时，重置表单验证状态
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('hidden.bs.modal', function() {
            const form = this.querySelector('form');
            if (form) {
                form.classList.remove('was-validated');
                form.reset();
            }
        });
    });
    
    // 初始化爬虫统计信息
    updateCrawlerStats();
});