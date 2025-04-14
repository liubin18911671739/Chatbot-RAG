// frontend/src/services/auth.js

import axios from 'axios';
import crypto from 'crypto';

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:5000/api/auth/';
const CAS_SERVICE_URL = 'http://cas1.bisu.edu.cn/tpass/service/LoginService?wsdl';

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
        // 这里使用简单的MD5加密作为示例
        // 实际使用中可能需要根据CAS系统的要求调整加密算法
        return crypto.createHash('md5').update(data).digest('hex');
    }
    
    // 调用CAS WebService进行认证
    loginWithCAS(username, password) {
        // 加密用户名和密码
        const encryptedUsername = this.encryptData(username);
        const encryptedPassword = this.encryptData(password);
        
        // 构建SOAP请求
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
        
        // 发送SOAP请求
        return axios.post(CAS_SERVICE_URL, soapRequest, {
            headers: { 
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': ''
            }
        })
        .then(response => {
            // 解析SOAP响应
            const responseText = response.data;
            // 简单解析响应中的JSON数据
            const jsonMatch = responseText.match(/<return>(.*?)<\/return>/);
            if (jsonMatch && jsonMatch[1]) {
                const result = JSON.parse(jsonMatch[1]);
                if (result.success === true) {
                    // 如果认证成功，存储用户信息
                    const userData = {
                        username: username,
                        authenticated: true,
                        authType: 'CAS'
                    };
                    localStorage.setItem('user', JSON.stringify(userData));
                }
                return result;
            }
            return { success: false, message: '无法解析认证响应' };
        })
        .catch(error => {
            console.error('CAS认证错误:', error);
            return { success: false, message: '认证服务请求失败' };
        });
    }
}

export default new AuthService();