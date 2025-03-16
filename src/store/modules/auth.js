import auth from '@/services/auth';

const state = {
  user: null,
  token: null,
};

const mutations = {
  SET_USER(state, user) {
    state.user = user;
  },
  SET_TOKEN(state, token) {
    state.token = token;
  },
};

const actions = {
  async login({ commit }, credentials) {
    const response = await auth.login(credentials);
    commit('SET_USER', response.user);
    commit('SET_TOKEN', response.token);
  },
  async logout({ commit }) {
    await auth.logout();
    commit('SET_USER', null);
    commit('SET_TOKEN', null);
  },
  async getUserInfo({ commit }) {
    const user = await auth.getUserInfo();
    commit('SET_USER', user);
  },
};

const getters = {
  isAuthenticated: (state) => !!state.token,
  getUser: (state) => state.user,
};

export default {
  state,
  mutations,
  actions,
  getters,
};