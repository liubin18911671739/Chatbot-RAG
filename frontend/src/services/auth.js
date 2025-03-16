// frontend/src/services/auth.js

import axios from 'axios';

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:5000/api/auth/';

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
}

export default new AuthService();