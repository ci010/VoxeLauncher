/**
 * @type {import('./config').ConfigModule}
 */
const mod = {
    namespaced: true,
    state: {
        locale: '',
        locales: [],
        updateInfo: null,
        allowPrerelease: false,
        autoInstallOnAppQuit: false,
        autoDownload: false,
        readyToUpdate: false,
        settings: {},
    },
    mutations: {
        allowPrerelease(state, allowPrerelease) {
            if (typeof allowPrerelease === 'boolean') { state.allowPrerelease = allowPrerelease; }
        },
        autoInstallOnAppQuit(state, autoInstallOnAppQuit) {
            if (typeof autoInstallOnAppQuit === 'boolean') state.autoInstallOnAppQuit = autoInstallOnAppQuit;
        },
        autoDownload(state, autoDownload) {
            if (typeof autoDownload === 'boolean') state.autoDownload = autoDownload;
        },
        updateInfo(state, updateInfo) {
            if (typeof updateInfo === 'object') state.updateInfo = updateInfo;
        },
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
