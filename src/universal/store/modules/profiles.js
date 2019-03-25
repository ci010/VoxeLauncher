import uuid from 'uuid';
import { ActionContext } from 'vuex';
import Vue from 'vue';

export default {
    namespaced: true,
    state: () => ({
        /**
         * @type {Profile[]}
         */
        all: [],
    }),
    getters: {
        profiles: state => state.all.map(mName => state[mName]),
        get: state => id => state[id],
        ids: state => state.all,
    },
    mutations: {
        add(state, payload) {
            /**
             * Prevent the case that hot reload keep the vuex state
             */
            if (state.all.indexOf(payload.id) === -1) {
                state.all.push(payload.id);
            }
        },
        remove(state, id) {
            const idx = state.all.indexOf(id);
            if (idx === -1) return;
            Vue.delete(state.all, idx);
        },

        all(state, payload) {
            state.all = payload;
        },
    },
    actions: {
        async load(context) {
            const json = await context.dispatch('read', { path: 'profiles.json', type: 'json' }, { root: true });
            const profiles = json.profiles;
            if (!(profiles instanceof Array)) return Promise.resolve();
            return Promise.all(profiles.map(id => context.dispatch('exist', `profiles/${id}/profile.json`, { root: true })
                .then((exist) => {
                    if (exist) {
                        context.commit('add', { id });
                        return context.dispatch(`${id}/load`);
                    }
                    return Promise.resolve();
                })
                .catch((e) => { console.error(e); }),
            ));
        },
        save(context) {
            return context.dispatch('write', {
                path: 'profiles.json',
                data: ({ profiles: context.state.all }),
            }, { root: true });
        },
        /**
         * @param {ActionContext} context 
         * @param {CreateOption} payload 
         * @return {Promise<string>}
         */
        create(context, payload) {
            const {
                type,
                option = {},
            } = payload;
            const id = uuid();
            option.java = option.java || context.rootGetters['java/default'];
            context.commit('add', { id, type });
            if (!option.mcversion) option.mcversion = context.rootGetters['versions/minecraft/release'];

            console.log('Create profile with option');
            console.log(option);
            return context.dispatch(`${id}/edit`, { ...option, type });
        },
        /**
         * 
         * @param {ActionContext} context 
         * @param {string} payload 
         */
        delete(context, payload) {
            context.commit('remove', payload);
            return context.dispatch('delete', `profiles/${payload}`, { root: true });
        },
    },
};
