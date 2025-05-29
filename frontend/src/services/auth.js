// frontend/src/services/auth.js

import axios from 'axios';
import router from '../router'; // 导入路由实例用于认证后跳转

// const API_URL = process.env.VUE_APP_API_URL || 'http://10.10.15.210:5000/api/auth/';
// RADIUS认证的API端点
// const API_URL = 'http://localhost:5000/api/auth/';

// const RADIUS_LOGIN_URL = 'http://localhost:5000/api/auth/radius-login';

// const API_URL = 'http://aiqa.bisu.edu.cn:5000/api/auth/';
// const RADIUS_LOGIN_URL = 'http://aiqa.bisu.edu.cn:5000/api/auth/radius-login';
const RADIUS_LOGIN_URL = 'http://10.10.15.211:5000/api/auth/radius-login';

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
    }    getCurrentUser() {
        return JSON.parse(localStorage.getItem('user'));
    }
    
    // 使用RADIUS进行认证
    async loginWithRADIUS(username, password) {
        console.log('开始RADIUS认证流程...');
        
        try {
            const response = await axios.post(RADIUS_LOGIN_URL, {
                username,
                password
            }, {
                timeout: 10000, // 添加10秒超时
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            // 检查后端返回的状态码和消息
            if (response.status === 200 && response.data && response.data.message === "Login successful") {
                console.log('RADIUS认证成功');
                // 存储用户信息
                const userData = {
                    username: username,
                    authenticated: true,
                    authType: 'RADIUS',
                    timestamp: new Date().getTime()
                };                localStorage.setItem('user', JSON.stringify(userData));
                
                // 认证服务不再处理路由跳转，由组件自行处理
                
                return { 
                    success: true,
                    // 注意: 后端 /radius-login 响应中目前没有 token，所以 response.data.token 会是 undefined
                    // 如果后端将来会返回 token，这里的代码是兼容的
                    token: response.data.token 
                };
            } else {
                console.log('RADIUS认证失败:', response.data);
                return { 
                    success: false, 
                    message: response.data && response.data.message ? response.data.message : 'RADIUS认证失败'
                };
            }
        } catch (error) {
            console.error('RADIUS认证错误:', error);
            
            // 开发环境下提供更多详细错误信息
            let errorMessage = 'RADIUS认证服务请求失败';
            let devDetails = null;
            
            if (error.response) {
                // 服务器返回了响应，但状态码不在2xx范围
                errorMessage = `服务器错误 (${error.response.status})`;
                devDetails = error.response.data ? error.response.data.toString().substring(0, 200) : '无响应数据';            } else if (error.request) {
                // 请求已发送但没有收到响应
                errorMessage = '认证服务连接异常';
                // devDetails = error.message || 'Network Error';
                devDetails = '网络连接问题';
                
                // 开发环境下的测试账号处理
                if (process.env.NODE_ENV === 'development') {
                    if (username === 'testing' && password === 'password') {
                        console.log('开发模式：使用RADIUS测试账号登录成功');
                        const userData = {
                            username: username,
                            authenticated: true,
                            authType: 'RADIUS_DEV',
                            timestamp: new Date().getTime()
                        };
                        localStorage.setItem('user', JSON.stringify(userData));
                        return { 
                            success: true,
                            message: '开发模式：RADIUS模拟认证成功',
                            token: 'radius-dev-token'
                        };
                    }
                }
            } else {
                // 请求配置出错
                errorMessage = 'RADIUS认证请求配置错误';
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
}

export default new AuthService();