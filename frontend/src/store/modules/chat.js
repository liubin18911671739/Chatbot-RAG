// This file contains the Vuex store module for managing chat-related state in the RAG Q&A system.

const state = {
    messages: [],
    loading: false,
    error: null,
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
};

const actions = {
    sendMessage({ commit }, message) {
        commit('SET_LOADING', true);
        // Simulate API call
        setTimeout(() => {
            commit('ADD_MESSAGE', { text: message, type: 'user' });
            // Here you would typically call an API to get the response
            const response = { text: 'This is a simulated response.', type: 'agent' };
            commit('ADD_MESSAGE', response);
            commit('SET_LOADING', false);
        }, 1000);
    },
    clearChat({ commit }) {
        commit('CLEAR_MESSAGES');
    },
};

const getters = {
    allMessages: (state) => state.messages,
    isLoading: (state) => state.loading,
    error: (state) => state.error,
};

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters,
};