// frontend/src/store/modules/auth.js

import { login, logout, getUserInfo } from '@/services/auth';

const state = {
  token: localStorage.getItem('token') || '',
  userInfo: {},
};

const mutations = {
  SET_TOKEN(state, token) {
    state.token = token;
    localStorage.setItem('token', token);
  },
  SET_USER_INFO(state, userInfo) {
    state.userInfo = userInfo;
  },
  CLEAR_AUTH(state) {
    state.token = '';
    state.userInfo = {};
    localStorage.removeItem('token');
  },
};

const actions = {
  async login({ commit }, userInfo) {
    const { data } = await login(userInfo);
    commit('SET_TOKEN', data.token);
    commit('SET_USER_INFO', data.user);
  },
  async logout({ commit }) {
    await logout();
    commit('CLEAR_AUTH');
  },
  async fetchUserInfo({ commit }) {
    const { data } = await getUserInfo();
    commit('SET_USER_INFO', data);
  },
};

const getters = {
  isAuthenticated: (state) => !!state.token,
  getUserInfo: (state) => state.userInfo,
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};