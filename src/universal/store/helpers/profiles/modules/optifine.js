export default {
    namespaced: true,
    state: () => ({
        enabled: false,
        version: '',
        settings: {},
    }),
    mutations: {
        toggle(state) { state.enabled = !state.enabled; },
        version(state, version) { state.version = version; },
    },
    actions: {
        load() { },
    },
};
