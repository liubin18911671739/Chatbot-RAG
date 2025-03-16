// This file is the main Vuex store configuration for the RAG QA system.
// It combines all the modules and sets up the Vuex store for state management.

import Vue from 'vue';
import Vuex from 'vuex';
import auth from './modules/auth';
import chat from './modules/chat';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    auth,
    chat,
  },
  state: {
    // Global state can be defined here if needed
  },
  mutations: {
    // Global mutations can be defined here if needed
  },
  actions: {
    // Global actions can be defined here if needed
  },
  getters: {
    // Global getters can be defined here if needed
  },
});