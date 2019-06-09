
import Vue from 'vue';
import Vuex from 'vuex';

import modules from './modules/base';

Vue.use(Vuex);

export default {
    state: {
        root: '',
    },
    modules,
    mutations: {},
    getters: {
    },
    strict: process.env.NODE_ENV !== 'production',
};
