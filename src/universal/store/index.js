
import Vue from 'vue';
import Vuex from 'vuex';
import path from 'path';
import { shell } from 'electron';
import modules from './modules';

Vue.use(Vuex);

/**
 * @type {import('./index').RootModule}
 */
const mod = {
    state: {
        root: '',
    },
    modules,
    getters: {
        path: state => (...paths) => path.join(state.root, ...paths),
    },
    mutations: {
        root(state, root) {
            state.root = root;
        },
    },
    actions: {
        async showItemInFolder(context, item) {
            shell.showItemInFolder(item);
        },
        async openItem(context, item) {
            shell.openItem(item);
        },
    },
    strict: process.env.NODE_ENV !== 'production',
};

export default mod;
