import Vue from 'vue';

/**
 * @type {import('./resource').ResourceModule}
 */
const mod = {
    namespaced: true,
    state: () => ({
        mods: {},
        resourcepacks: {},
    }),
    getters: {
        domains: state => ['mods', 'resourcepacks'],
        mods: state => Object.keys(state.mods).map(k => state.mods[k]) || [],
        resourcepacks: state => Object.keys(state.resourcepacks)
            .map(k => state.resourcepacks[k]) || [],
        getResource: (state, getters) => (hash) => {
            for (const domain of getters.domains) {
                if (state[domain][hash]) return state[domain][hash];
            }
            return undefined;
        },
    },
    mutations: {
        rename(state, { domain, hash, name }) {
            state[domain][hash].name = name;
        },
        resource: (state, res) => {
            if (!state[res.domain]) Vue.set(state, res.domain, {});
            Vue.set(state[res.domain], res.hash, res);
        },
        resources: (state, all) => {
            for (const res of all) {
                Vue.set(state[res.domain], res.hash, res);
            }
        },
        remove(state, resource) {
            Vue.delete(state[resource.domain], resource.hash);
        },
    },
};

export default mod;
