import Vue from 'vue';
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
        error(state) {
            const errors = [];
            if (state.all.length === 0) {
                errors.push('error.installJava');
            }
            return errors;
        },
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
            for (let i = 0; i < state.all.length; i++) {
                const j = state.all[i];
                if (j.path === java.path && j.version === java.version) {
                    Vue.delete(state.all, i);
                    if (state.all.length === 0) state.default = 0;
                    return;
                }
            }
        },
        default(state, def) { state.default = def; },
    },
};

export default mod;
