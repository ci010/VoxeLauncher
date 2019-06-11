
import Vue from 'vue';
import Vuex from 'vuex';

import modules from './modules/base';

Vue.use(Vuex);

export default {
    state: {
        root: '',
        online: false,
    },
    modules,
    mutations: {
        online(state, o) { state.online = o; },
        root(state, r) { state.root = r; },
    },
    getters: {
    },
    strict: process.env.NODE_ENV !== 'production',
};
