import Vue from 'vue';

/**
 * @type {import('./resource').ResourceModule}
 */
const mod = {
    namespaced: true,
    state: {
        mods: {},
        resourcepacks: {},
    },
    getters: {
        domains: state => ['mods', 'resourcepacks'],
        mods: state => Object.keys(state.mods).map(k => state.mods[k]) || [],
        resourcepacks: state => Object.keys(state.resourcepacks)
            .map(k => state.resourcepacks[k]) || [],
        getResource: (state, getters) => (hash) => {
            for (const value of Object.values(state)) {
                if (value[hash]) return value[hash];
            }
            return undefined;
        },
    },
    mutations: {
        rename(state, { domain, hash, name }) {
            if (domain === 'mods') {
                state.mods[hash].name = name;
            } else {
                state.resourcepacks[hash].name = name;
            }
        },
        resource: (state, res) => {
            if (!state[res.domain]) {
                console.error(`Cannot accept resource for unknown domain [${res.domain}]`);
                return;
            }
            Vue.set(state[res.domain], res.hash, res);
        },
        resources: (state, all) => {
            for (const res of all) {
                if (!state[res.domain]) {
                    console.error(`Cannot accept resource for unknown domain [${res.domain}]`);
                } else {
                    Vue.set(state[res.domain], res.hash, res);
                }
            }
        },
        remove(state, resource) {
            Vue.delete(state[resource.domain], resource.hash);
        },
    },
};

export default mod;
