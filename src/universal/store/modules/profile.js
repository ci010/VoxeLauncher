import uuid from 'uuid';
import { ActionContext } from 'vuex';
import Vue from 'vue';

function createTemplate() {
    return {
        id: '',

        name: '',

        resolution: { width: 800, height: 400, fullscreen: false },
        java: '',
        minMemory: 1024,
        maxMemory: 2048,
        vmOptions: [],
        mcOptions: [],

        mcversion: '',

        type: 'modpack',

        /**
         * Server section
         */
        servers: [],
        primary: -1,

        host: '',
        port: 25565,
        isLanServer: false,
        icon: '',

        status: {},

        /**
         * Modpack section
         */

        author: '',
        description: '',
        url: '',

        logWindow: false,

        maps: [],

        forge: {
            enabled: false,
            mods: [],
            version: '',
        },
        liteloader: {
            enabled: false,
            mods: [],
            version: '',
            settings: {},
        },
        optifine: {
            enabled: false,
            settings: {},
        },
    };
}
/**
 * @type {import('./profile').ProfileModule}
 */
const mod = {
    namespaced: true,
    state: () => ({
        all: [],
        id: '',
    }),
    getters: {
        ids: state => state.all.map(p => p.id),
        current: state => state.all[state.id],
    },
    mutations: {
        create(state, profile) {
            /**
             * Prevent the case that hot reload keep the vuex state
             */
            if (!state.all.some(prof => prof.id === profile.id)) {
                state.all.push(profile);
            }
        },
        remove(state, id) {
            for (let i = 0; i < state.all.length; i++) {
                const prof = state.all[i];
                if (prof.id === id) {
                    Vue.delete(state.all, i);
                    break;
                }
            }
        },
        select(state, id) {
            if (state.all.some(prof => prof.id === id)) {
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
    },
    actions: {
        async load(context) {
            const json = await context.dispatch('read', { path: 'profiles.json', type: 'json', fallback: {} }, { root: true });

            const profiles = json.profiles;
            if (!(profiles instanceof Array)) return;

            await Promise.all(profiles.map(async (id) => {
                const exist = await context.dispatch('exists', `profiles/${id}/profile.json`, { root: true });
                if (!exist) return;
                const profile = await context.dispatch('read', { path: `${id}/profile.json`, type: 'json' }, { root: true });
                context.commit('create', profile);
            }));
        },

        save(context, { mutation }) {
            if (mutation === 'create' || mutation === 'remove') {
                return context.dispatch('write', {
                    path: 'profiles.json',
                    data: ({ profiles: context.getters.ids }),
                }, { root: true });
            }

            const current = context.getters.current;
            const persistent = {};
            const mask = { status: true, settings: true, optifine: true };
            Object.keys(current).filter(k => mask[k] === undefined)
                .forEach((k) => { persistent[k] = current[k]; });

            return context.dispatch('write', {
                path: `${current.id}/profile.json`,
                data: persistent,
            }, { root: true });
        },

        create(context, payload) {
            const { type } = payload;

            if (type !== 'modpack' && type !== 'server') {
                payload.type = 'modpack';
            }

            payload.id = uuid();
            payload.java = payload.java || context.rootGetters['java/default'];
            payload.mcversion = payload.mcversion || context.rootGetters['versions/minecraft/release'];

            context.commit('create', payload);

            console.log('Create profile with option');
            console.log(payload);
        },

        delete(context, payload) {
            context.commit('remove', payload);
            return context.dispatch('delete', `profiles/${payload}`, { root: true });
        },
    },
};

export default mod;
