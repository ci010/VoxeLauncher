import Vue from 'vue';
import { requireString, requireObject } from '../helpers/utils';
/**
 * @type { import("./java").JavaModule }
 */
const mod = {
    namespaced: true,
    state: {
        all: [],
        default: 0,
    },
    getters: {
        default: state => state.all[state.default],
        missing: state => state.all.length === 0,
    },
    mutations: {
        set(state, all) {
            state.all = all;

            if (state.default >= state.all.length) state.default = 0;
        },
        add(state, java) {
            if (java instanceof Array) {
                state.all.push(...java);
            } else {
                state.all.push(java);
            }
            if (state.default >= state.all.length) state.default = 0;
        },
        remove(state, java) {
            requireObject(java);
            requireString(java.path);
            for (let i = 0; i < state.all.length; i++) {
                const j = state.all[i];
                if (j.path === java.path && j.version === java.version) {
                    Vue.delete(state.all, i);
                    if (state.all.length === 0) state.default = 0;
                    return;
                }
            }
        },
        default(state, def) {
            requireObject(def);
            requireString(def.path);
            state.default = def;
        },
    },
};

export default mod;
