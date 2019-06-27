import { app } from 'electron';
import locales from 'static/locales';
import { autoUpdater, UpdaterSignal } from 'electron-updater';
import Task from 'treelike-task';
import base from 'universal/store/modules/config';
import isInGFW from 'in-gfw';
import { overrideNet, unoverrideNet } from 'main/utils/dns-override';
import dnsOverrideMapping from 'static/dns-override.json';

/**
 * @type {import('universal/store/modules/config').ConfigModule}
 */
const mod = {
    ...base,
    actions: {
        async load(context) {
            const data = await context.dispatch('getPersistence', { path: 'config.json' }) || {};
            context.commit('config', {
                locale: data.locale || app.getLocale(),
                locales: Object.keys(locales),
                autoInstallOnAppQuit: data.autoInstallOnAppQuit,
                autoDownload: data.autoDownload,
                allowPrerelease: data.allowPrerelease,
                settings: data.settings,
            });
        },
        async save(context, { mutation }) {
            switch (mutation) {
                case 'config':
                case 'locale':
                case 'allowPrerelease':
                case 'autoInstallOnAppQuit':
                case 'autoDownload':
                case 'settings':
                    await context.dispatch('setPersistence', {
                        path: 'config.json',
                        data: {
                            locale: context.state.locale,
                            autoInstallOnAppQuit: context.state.autoInstallOnAppQuit,
                            autoDownload: context.state.autoDownload,
                            allowPrerelease: context.state.allowPrerelease,
                            settings: context.state.settings,
                        },
                    });
                    break;
                default:
            }
        },

        async quitAndInstall(context) {
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
            return dispatch('executeTask', task);
        },

        async downloadUpdate(context) {
            const task = Task.create('downloadUpdate', async (ctx) => {
                const inGFW = isInGFW();

                if (!context.state.autoDownload) {
                    context.commit('downloadingUpdate', true);
                    await new Promise((resolve, reject) => {
                        if (inGFW) {
                            overrideNet(dnsOverrideMapping);
                        }
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
                    }).finally(() => {
                        unoverrideNet();
                        context.commit('downloadingUpdate', false);
                    });
                } else {
                    throw 'cancelled';
                }
            });
            return context.dispatch('executeTask', task);
        },
    },
};

export default mod;
