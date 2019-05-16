import Vue from 'vue';
import { fitin } from '../helpers/utils';

/**
 * @type {import('./profile').ProfileModule}
 */
const mod = {
    dependencies: ['java', 'version', 'version/minecraft', 'user'],
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
            } else if (state.id === '') {
                state.id = Object.keys(state.all)[0];
            }
        },
        edit(state, settings) {
            const prof = state.all[state.id];

            prof.name = settings.name || prof.name;
            prof.author = settings.author || prof.author;
            prof.description = settings.description || prof.description;

            prof.mcversion = settings.mcversion || prof.mcversion;

            prof.minMemory = settings.minMemory || prof.minMemory;
            prof.maxMemory = settings.maxMemory || prof.maxMemory;
            prof.java = settings.java || prof.java;

            if (prof.java && !prof.java.path) {
                prof.java = undefined;
            }

            prof.version = settings.version || prof.version;
            prof.forceVersion = settings.forceVersion || prof.forceVersion;

            prof.type = settings.type || prof.type;
            prof.port = settings.port || prof.port;

            prof.showLog = settings.showLog || prof.showLog;
            prof.hideLauncher = settings.hideLauncher || prof.hideLauncher;
        },

        maps(state, maps) {
            state.all[state.id].maps = maps;
        },

        gamesettings(state, settings) {
            fitin(state.all[state.id].settings, settings);
        },

        diagnose(state, { diagnosis, errors }) {
            const id = state.id;
            if (state.all[id].diagnosis === undefined) state.all[id].diagnosis = {};
            state.all[id].diagnosis = Object.freeze(diagnosis);
            state.all[id].errors = Object.freeze(errors);
        },
    },
};

export default mod;
