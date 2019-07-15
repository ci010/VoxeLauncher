
import Vue from 'vue';
import Vuex from 'vuex';

import state from './state';
import mutations from './mutations';
import modules from './modules/base';
import getters from './getters';

Vue.use(Vuex);

export default {
    state,
    modules,
    mutations,
    getters,
    strict: process.env.NODE_ENV !== 'production',
};
