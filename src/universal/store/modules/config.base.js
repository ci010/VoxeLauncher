/**
 * @type {import('./config').ConfigModule}
 */
const mod = {
    namespaced: true,
    state: {
        locale: '',
        locales: [],
        updateInfo: null,
        readyToUpdate: false,
        allowPrerelease: false,
        autoInstallOnAppQuit: false,
        downloadingUpdate: false,
        checkingUpdate: false,
        autoDownload: false,
        settings: {},
    },
    mutations: {
        downloadingUpdate(state, d) { state.downloadingUpdate = !!d; },
        checkingUpdate(state, d) { state.checkingUpdate = !!d; },
        updateInfo(state, updateInfo) {
            if (typeof updateInfo === 'object') state.updateInfo = updateInfo;
        },
        allowPrerelease(state, allowPrerelease) {
            if (typeof allowPrerelease === 'boolean') { state.allowPrerelease = allowPrerelease; }
        },
        autoInstallOnAppQuit(state, autoInstallOnAppQuit) {
            if (typeof autoInstallOnAppQuit === 'boolean') state.autoInstallOnAppQuit = autoInstallOnAppQuit;
        },
        autoDownload(state, autoDownload) {
            if (typeof autoDownload === 'boolean') state.autoDownload = autoDownload;
        },
        locale(state, language) {
            state.locale = language;
        },
        config(state, config) {
            state.locale = config.locale;
            state.locales = config.locales;
            state.autoDownload = config.autoDownload || false;
            state.autoInstallOnAppQuit = config.autoDownload || false;
            state.allowPrerelease = config.allowPrerelease || false;
        },
        settings(state, settings) {
            Object.assign(state.settings, settings);
        },
    },
};

export default mod;
