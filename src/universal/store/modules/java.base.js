import Vue from 'vue';
/**
 * @type { import("./java").JavaModule }
 */
const mod = {
    namespaced: true,
    state: {
        all: [],
        default: '',
    },
    getters: {
        all: state => state.all,
        default: state => state.default,
        error(state) {
            const errors = [];
            if (state.all.length === 0) {
                errors.push('error.installJava');
            }
            return errors;
        },
    },
    mutations: {
        add(state, java) {
            if (java instanceof Array) {
                state.all.push(...java);
            } else {
                state.all.push(java);
            }
            if (!state.default) state.default = state.all[0];
        },
        remove(state, java) {
            const index = state.all.indexOf(java);
            if (index !== -1) Vue.delete(state.all, index);
            if (state.all.length === 0) state.default = '';
        },
        default(state, def) { state.default = def; },
    },
};

export default mod;
