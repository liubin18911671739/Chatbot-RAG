// frontend/src/services/auth.js

import axios from 'axios';
import crypto from 'crypto';

const API_URL = process.env.VUE_APP_API_URL || 'http://10.10.15.210:5000/api/auth/';
const CAS_SERVICE_URL = 'http://cas.bisu.edu.cn/tpass/service/LoginService?wsdl';
// 设置一个备用测试服务器URL，在主服务器不可用时使用
const BACKUP_SERVICE_URL = process.env.VUE_APP_BACKUP_CAS_URL || 'http://localhost:5100/mock/cas-service';

class AuthService {
    login(username, password) {
        return axios
            .post(`${API_URL}login`, {
                username,
                password
            })
            .then(response => {
                if (response.data.token) {
                    localStorage.setItem('user', JSON.stringify(response.data));
                }
                return response.data;
            });
    }

    logout() {
        localStorage.removeItem('user');
    }

    register(username, password) {
        return axios.post(`${API_URL}register`, {
            username,
            password
        });
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('user'));
    }
    
    // 加密用户名和密码
    encryptData(data) {
        // 使用MD5加密，根据CAS系统的要求
        return crypto.createHash('md5').update(data).digest('hex');
    }
    
    // 测试CAS服务连接状态
    async testCASConnection() {
        try {
            // 使用OPTIONS请求来检测服务是否可用，避免发送实际的SOAP请求
            const response = await axios({
                method: 'OPTIONS',
                url: CAS_SERVICE_URL,
                timeout: 3000,
                validateStatus: function (status) {
                    return status < 500; // 接受任何非500错误的状态
                }
            });
            return true;
        } catch (error) {
            console.warn('CAS服务连接测试失败:', error.message);
            return false;
        }
    }
    
    // 调用CAS WebService进行认证
    async loginWithCAS(username, password) {
        try {
            console.log('开始CAS认证流程...');
            
            // 加密用户名和密码
            const encryptedUsername = this.encryptData(username);
            const encryptedPassword = this.encryptData(password);
            console.log('用户凭据已加密');
            
            // 构建SOAP请求 - 使用loginValidate方法
            const soapRequest = `
                <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.tpass.cas.bisu.edu.cn/">
                    <soapenv:Header/>
                    <soapenv:Body>
                        <ser:loginValidate>
                            <username>${encryptedUsername}</username>
                            <password>${encryptedPassword}</password>
                        </ser:loginValidate>
                    </soapenv:Body>
                </soapenv:Envelope>
            `;
            
            console.log('SOAP请求已准备，正在发送...');
            
            // 发送SOAP请求
            const response = await axios.post(CAS_SERVICE_URL, soapRequest, {
                headers: { 
                    'Content-Type': 'text/xml;charset=UTF-8',
                    'SOAPAction': ''
                },
                timeout: 10000 // 10秒超时
            });
            
            console.log('收到SOAP响应，正在解析...');
            
            // 解析SOAP响应
            const responseText = response.data;
            console.log('SOAP响应内容:', responseText);
            
            // 从SOAP响应中提取JSON结果
            const jsonMatch = responseText.match(/<return>(.*?)<\/return>/s);
            if (jsonMatch && jsonMatch[1]) {
                try {
                    // 解析JSON字符串结果
                    const result = JSON.parse(jsonMatch[1].trim());
                    console.log('解析的JSON结果:', result);
                    
                    if (result.success === true) {
                        console.log('CAS认证成功');
                        // 如果认证成功，存储用户信息
                        const userData = {
                            username: username,
                            authenticated: true,
                            authType: 'CAS_SOAP',
                            timestamp: new Date().getTime()
                        };
                        localStorage.setItem('user', JSON.stringify(userData));
                        return { success: true };
                    } else {
                        console.log('CAS认证失败');
                        return { 
                            success: false, 
                            message: '用户名或密码错误' 
                        };
                    }
                } catch (parseError) {
                    console.error('解析JSON结果失败:', parseError);
                    return { 
                        success: false, 
                        message: '无法解析认证响应',
                        error: parseError.message
                    };
                }
            } else {
                console.error('无法在SOAP响应中找到return标签');
                
                // 尝试直接在响应文本中查找success标记
                if (responseText.includes('"success":true')) {
                    console.log('通过文本匹配检测到成功响应');
                    const userData = {
                        username: username,
                        authenticated: true,
                        authType: 'CAS_TEXT_MATCH',
                        timestamp: new Date().getTime()
                    };
                    localStorage.setItem('user', JSON.stringify(userData));
                    return { success: true };
                }
                
                return { 
                    success: false, 
                    message: '无法解析认证响应' 
                };
            }
        } catch (error) {
            console.error('CAS认证错误:', error);
            
            // 开发环境下提供更多详细错误信息
            let errorMessage = '认证服务请求失败';
            let devDetails = null;
            
            if (error.response) {
                // 服务器返回了响应，但状态码不在2xx范围
                errorMessage = `服务器错误 (${error.response.status})`;
                devDetails = error.response.data ? error.response.data.toString().substring(0, 200) : '无响应数据';
            } else if (error.request) {
                // 请求已发送但没有收到响应
                errorMessage = '无法连接到认证服务器';
                devDetails = error.message || 'Network Error';
                
                // 如果是在开发环境，提供测试账号的备用认证方式
                if (process.env.NODE_ENV === 'development') {
                    // 开发环境下的特定测试账号认证
                    if (username === '20090025' && password === '?Lb!816003') {
                        console.log('开发模式：使用测试账号登录成功');
                        const userData = {
                            username: username,
                            authenticated: true,
                            authType: 'DEV_FALLBACK',
                            timestamp: new Date().getTime()
                        };
                        localStorage.setItem('user', JSON.stringify(userData));
                        return { 
                            success: true,
                            message: '开发模式：模拟认证成功'
                        };
                    }
                }
            } else {
                // 请求配置出错
                errorMessage = '认证请求配置错误';
                devDetails = error.message;
            }
            
            // 根据环境返回不同级别的错误详情
            return { 
                success: false, 
                message: errorMessage,
                devDetails: process.env.NODE_ENV === 'development' ? devDetails : null,
                error: process.env.NODE_ENV === 'development' ? error.message : null
            };
        }
    }
    
    // 使用代理服务器进行CAS认证（如需通过后端代理解决跨域问题）
    async loginWithCASProxy(username, password) {
        const proxyUrl = process.env.VUE_APP_CAS_PROXY || '/api/auth/cas-proxy';
        console.log('使用代理服务进行CAS认证:', proxyUrl);
        
        try {
            const response = await axios.post(proxyUrl, {
                username,
                password
            });
            
            if (response.data && response.data.success) {
                console.log('代理认证成功');
                const userData = {
                    username: username,
                    authenticated: true,
                    authType: 'CAS_PROXY',
                    timestamp: new Date().getTime()
                };
                localStorage.setItem('user', JSON.stringify(userData));
                return { success: true };
            } else {
                console.log('代理认证失败:', response.data);
                return response.data || { 
                    success: false, 
                    message: '认证失败' 
                };
            }
        } catch (error) {
            console.error('CAS代理认证错误:', error);
            return { 
                success: false, 
                message: '代理认证服务请求失败',
                error: process.env.NODE_ENV === 'development' ? error.message : null
            };
        }
    }
}

export default new AuthService();