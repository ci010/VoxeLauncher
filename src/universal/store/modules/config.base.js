/**
 * @type {import('./config').ConfigModule}
 */
const mod = {
    namespaced: true,
    state: {
        locale: '',
        locales: [],
    },
    mutations: {
        locale(state, language) {
            state.locale = language;
        },
        config(state, config) {
            state.locale = config.locale;
            state.locales = config.locales;
        },
    },
};

export default mod;
