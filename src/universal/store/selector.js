import Vue from 'vue';
import Vuex from 'vuex';

import state from './state';
import mutations from './mutations';
import getters from './getters';

Vue.use(Vuex);

/**
 * 
 * @param {{modules: string[], plugins: string[]}} option
 */
export default function select(option) {
    const result = {
        state,
        mutations,
        modules: {},
        getters,
        strict: process.env.NODE_ENV !== 'production',
    };
    if (option.modules) {
        const context = require.context('./modules', false, /\.js$/);
        option.modules.concat(['io', 'task', 'config'])
            .forEach((m) => {
                console.log(m);
                result.modules[m] = context(`./${m}.js`).default;
            });
    }
    if (option.plugins) {
        const context = require.context('./plugins', false, /\.js$/);
        result.plugins = option.plugins.map(k => context(`./${k}.js`).default);
    }
    return result;
}
