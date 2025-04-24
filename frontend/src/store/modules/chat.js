// This file contains the Vuex store module for managing chat-related state in the RAG Q&A system.

const state = {
    messages: [],
    loading: false,
    error: null,
    // 添加历史对话缓存数组
    recentChats: JSON.parse(localStorage.getItem('recentChats') || '[]'),
};

const mutations = {
    ADD_MESSAGE(state, message) {
        state.messages.push(message);
    },
    SET_LOADING(state, loading) {
        state.loading = loading;
    },
    SET_ERROR(state, error) {
        state.error = error;
    },
    CLEAR_MESSAGES(state) {
        state.messages = [];
    },
    // 添加保存最近对话的mutation
    SAVE_RECENT_CHAT(state, chat) {
        // 检查是否已存在相同的对话
        const existingIndex = state.recentChats.findIndex(item => item.id === chat.id);
        
        if (existingIndex !== -1) {
            // 如果存在，先删除旧的
            state.recentChats.splice(existingIndex, 1);
        }
        
        // 添加到最前面
        state.recentChats.unshift(chat);
        
        // 只保留最新的5条记录
        if (state.recentChats.length > 5) {
            state.recentChats.pop();
        }
        
        // 更新本地存储
        localStorage.setItem('recentChats', JSON.stringify(state.recentChats));
    },
    // 清除所有最近对话
    CLEAR_RECENT_CHATS(state) {
        state.recentChats = [];
        localStorage.removeItem('recentChats');
    },
};

const actions = {
    sendMessage({ commit, state }, message) {
        commit('SET_LOADING', true);
        // Simulate API call
        setTimeout(() => {
            commit('ADD_MESSAGE', { text: message, type: 'user' });
            // Here you would typically call an API to get the response
            const response = { text: 'This is a simulated response.', type: 'agent' };
            commit('ADD_MESSAGE', response);
            commit('SET_LOADING', false);
            
            // 创建或更新一条历史对话记录
            if (state.messages.length > 0) {
                const chatId = Date.now().toString();
                const title = message.length > 20 ? message.substring(0, 20) + '...' : message;
                
                commit('SAVE_RECENT_CHAT', {
                    id: chatId,
                    title: title,
                    lastMessage: response.text,
                    messages: [...state.messages],
                    createdAt: new Date().toISOString()
                });
            }
        }, 1000);
    },
    clearChat({ commit }) {
        commit('CLEAR_MESSAGES');
    },
    // 添加加载指定历史对话的action
    loadRecentChat({ commit }, chatId) {
        const recentChats = JSON.parse(localStorage.getItem('recentChats') || '[]');
        const chat = recentChats.find(chat => chat.id === chatId);
        
        if (chat) {
            // 清除当前消息
            commit('CLEAR_MESSAGES');
            
            // 加载历史消息
            chat.messages.forEach(message => {
                commit('ADD_MESSAGE', message);
            });
            
            return true;
        }
        
        return false;
    },
    // 清除所有历史对话
    clearRecentChats({ commit }) {
        commit('CLEAR_RECENT_CHATS');
    }
};

const getters = {
    allMessages: (state) => state.messages,
    isLoading: (state) => state.loading,
    error: (state) => state.error,
    // 添加获取最近对话的getter
    recentChats: (state) => state.recentChats,
};

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters,
};