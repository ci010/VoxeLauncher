/**
 * @type {import('./config').ConfigModule}
 */
const mod = {
    namespaced: true,
    state: {
        locale: '',
        locales: [],
        settings: {},
    },
    mutations: {
        locale(state, language) {
            state.locale = language;
        },
        config(state, config) {
            state.locale = config.locale;
            state.locales = config.locales;
        },
        settings(state, settings) {
            Object.assign(state.settings, settings);
        },
    },
};

export default mod;
