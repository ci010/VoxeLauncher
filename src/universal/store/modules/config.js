import { app } from 'electron';
import locales from 'static/locales';
import { autoUpdater } from 'electron-updater';
import base from './config.base';

/**
 * @type {import('./config').ConfigModule}
 */
const mod = {
    ...base,
    mutations: {
        ...base.mutations,
        locale(state, language) {
            state.locale = language;
        },
    },
    actions: {
        async load(context) {
            const data = await context.dispatch('getPersistence', { path: 'config.json' }, { root: true }) || {};
            context.commit('config', {
                locale: data.locale || app.getLocale(),
                locales: Object.keys(locales),
                autoInstallOnAppQuit: data.autoInstallOnAppQuit,
                autoDownload: data.autoDownload,
                allowPrerelease: data.allowPrerelease,
            });
        },
        save(context) {
            return context.dispatch('setPersistence', { path: 'config.json', data: context.state }, { root: true });
        },

        getLocale(context, locale) {
            return Promise.resolve(locales[locale]);
        },

        quitAndInstall(context) {
            if (context.state.readyToUpdate) {
                autoUpdater.quitAndInstall();
            }
        },

        async checkUpdate({ dispatch, commit }) {
            const id = await dispatch('task/spawn', 'checkUpdate', { root: true });

            try {
                const info = await autoUpdater.checkForUpdates();
                commit('updateInfo', info.updateInfo);
                await dispatch('task/finish', { id }, { root: true });
                return info.updateInfo;
            } catch (e) {
                commit('task/finish', { id, error: e }, { root: true });
                throw e;
            }
        },

        downloadUpdate(context) {
            if (!context.state.autoDownload) {
                autoUpdater.downloadUpdate();
            }
        },
    },
};

export default mod;
