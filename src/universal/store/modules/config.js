import { app } from 'electron';
import locales from 'static/locales';
import { autoUpdater } from 'electron-updater';
import Task from 'treelike-task';
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
            const task = Task.create('checkUpdate', async (context) => {
                try {
                    const info = await autoUpdater.checkForUpdates();
                    commit('updateInfo', info.updateInfo);
                    return info;
                } catch {
                    return undefined;
                }
            });
            const id = await dispatch('task/execute', task, { root: true });
            return id;
        },

        downloadUpdate(context) {
            if (!context.state.autoDownload) {
                autoUpdater.downloadUpdate();
            }
        },
    },
};

export default mod;
