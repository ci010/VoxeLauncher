
import Vue from 'vue';
import Vuex from 'vuex';

import modules from './modules';

Vue.use(Vuex);

export default {
    state: {
        root: '',
        online: false,
        platform: '',
    },
    modules,
    mutations: {
        online(state, o) { state.online = o; },
        root(state, r) { state.root = r; },
        platform(state, p) { state.platform = p; },
    },
    getters: {
    },
    strict: process.env.NODE_ENV !== 'production',
};
