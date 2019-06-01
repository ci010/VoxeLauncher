import { app } from 'electron';
import locales from 'static/locales';
import { autoUpdater, UpdaterSignal } from 'electron-updater';
import Task from 'treelike-task';
import base from './config.base';

function updateTask() {
    return ctx => new Promise((resolve, reject) => {
        autoUpdater.downloadUpdate();
        const signal = new UpdaterSignal(autoUpdater);
        signal.updateDownloaded((info) => {
            resolve(info);
        });
        signal.progress((info) => {
            ctx.update(info.transferred, info.total);
        });
        signal.updateCancelled((info) => {
            reject(info);
        });
        autoUpdater.on('error', (err) => {
            reject(err);
        });
    });
}

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
        save(context, { mutation }) {
            const filter = { updateInfo: true, checkingUpdate: true, downloadingUpdate: true };
            if (filter[mutation]) return Promise.resolve();
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
            commit('checkingUpdate', true);
            const task = Task.create('checkUpdate', async (context) => {
                try {
                    const info = await autoUpdater.checkForUpdates();
                    commit('updateInfo', info.updateInfo);
                    return info;
                } catch {
                    return undefined;
                } finally {
                    commit('checkingUpdate', false);
                }
            });
            const id = await dispatch('task/execute', task, { root: true });
            return id;
        },

        downloadUpdate(context) {
            if (!context.state.autoDownload) {
                context.commit('downloadingUpdate', true);
                const task = Task.create('downloadUpdate', updateTask());
                task.onFinish((_, node) => {
                    if (node === task.root) {
                        context.commit('downloadingUpdate', false);
                    }
                });
                return context.dispatch('task/execute', task);
            }
            return undefined;
        },
    },
};

export default mod;
