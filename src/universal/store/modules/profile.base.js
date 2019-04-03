import Vue from 'vue';

/**
 * @type {import('./profile').ProfileModule}
 */
const mod = {
    dependencies: ['java', 'versions', 'versions/minecraft', 'user'],
    namespaced: true,
    state: () => ({
        all: {},
        id: '',
    }),
    getters: {
        profiles: state => Object.keys(state.all).map(k => state.all[k]),
        ids: state => Object.keys(state.all),
        current: state => state.all[state.id],
    },
    mutations: {
        create(state, profile) {
            /**
             * Prevent the case that hot reload keep the vuex state
             */
            if (!state.all[profile.id]) {
                Vue.set(state.all, profile.id, profile);
            }
        },
        remove(state, id) {
            Vue.delete(state.all, id);
        },
        select(state, id) {
            if (state.all[id]) {
                state.id = id;
            }
        },
        edit(state, payload) {
            const prof = state.all[state.id];
            prof.java = payload.java || prof.java;
            prof.type = payload.type || prof.type;
            prof.name = payload.name || prof.name;
            prof.port = payload.port || prof.port;
        },

        diagnose(state, diagnosis) {
            if (state.all[state.id].diagnosis === undefined) state.all[state.id].diagnosis = {};
            Object.assign(state.all[state.id].diagnosis, diagnosis);
        },

        errors(state, errors) {
            state.all[state.id].errors = errors;
        },
    },
};

export default mod;
