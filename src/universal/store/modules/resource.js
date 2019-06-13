import Vue from 'vue';

/**
 * @type {import('./resource').ResourceModule}
 */
const mod = {
    state: {
        refreshing: false,
        mods: {},
        resourcepacks: {},
    },
    getters: {
        domains: state => ['mods', 'resourcepacks'],
        mods: state => Object.keys(state.mods).map(k => state.mods[k]) || [],
        resourcepacks: state => Object.keys(state.resourcepacks)
            .map(k => state.resourcepacks[k]) || [],
        getResource: (state, getters) => (hash) => {
            for (const value of [state.mods, state.resourcepacks]) {
                if (value[hash]) return value[hash];
            }
            return undefined;
        },
    },
    mutations: {
        refreshingResource(state, s) {
            state.refreshing = s;
        },
        resource: (state, res) => {
            switch (res.domain) {
                case 'mods':
                case 'resourcepacks':
                    Vue.set(state[res.domain], res.hash, res);
                    break;
                default:
                    console.error(`Cannot accept resource for unknown domain [${res.domain}]`);
            }
        },
        resources: (state, all) => {
            for (const res of all) {
                switch (res.domain) {
                    case 'mods':
                    case 'resourcepacks':
                        Vue.set(state[res.domain], res.hash, res);
                        break;
                    default:
                        console.error(`Cannot accept resource for unknown domain [${res.domain}]`);
                }
            }
        },
        removeResource(state, resource) {
            switch (resource.domain) {
                case 'mods':
                case 'resourcepacks':
                    Vue.delete(state[resource.domain], resource.hash);
                    break;
                default:
                    console.error(`Cannot remove resource for unknown domain [${resource.domain}]`);
            }
        },
    },
};

export default mod;
