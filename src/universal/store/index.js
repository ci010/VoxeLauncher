
import Vue from 'vue';
import Vuex from 'vuex';

import { shell } from 'electron';
import state from './state';
import mutations from './mutations';
import modules from './modules';
import getters from './getters';

Vue.use(Vuex);

export default {
    state,
    modules,
    plugins: [],
    mutations,
    getters,
    actions: {
        showItemInFolder(context, item) {
            shell.showItemInFolder(item);
        },
        openItem(context, item) {
            shell.openItem(item);
        },
    },
    strict: process.env.NODE_ENV !== 'production',
};
