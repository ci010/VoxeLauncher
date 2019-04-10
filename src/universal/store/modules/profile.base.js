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

            prof.name = payload.name || prof.name;
            prof.author = payload.author || prof.author;
            prof.description = payload.description || prof.description;
          
            prof.mcversion = payload.mcversion || prof.mcversion;
           
            prof.minMemory = payload.minMemory || prof.minMemory;
            prof.maxMemory = payload.maxMemory || prof.maxMemory;
            prof.java = payload.java || prof.java;

            prof.type = payload.type || prof.type;
            prof.port = payload.port || prof.port;

            prof.showLog = payload.showLog || prof.showLog;
            prof.hideLauncher = payload.hideLauncher || prof.hideLauncher;
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
