import { autoUpdater } from 'electron-updater';
import { ipcMain } from './ipc';

if (process.env.NODE_ENV === 'development') {
    autoUpdater.setFeedURL({
        provider: 'github',
        repo: 'VoxeLauncher',
        owner: 'ci010',
    });
    autoUpdater.logger = null;
}

ipcMain.on('store-ready', (store) => {
    store.watch(state => state.config.autoInstallOnAppQuit, (autoInstallOnAppQuit) => {
        autoUpdater.autoInstallOnAppQuit = autoInstallOnAppQuit;
    });
    store.watch(state => state.config.allowPrerelease, (allowPrerelease) => {
        autoUpdater.allowPrerelease = allowPrerelease;
    });
    store.watch(state => state.config.autoDownload, (autoDownload) => {
        autoUpdater.autoDownload = autoDownload;
    });

    console.log(`Current version is ${autoUpdater.currentVersion.raw}`);

    autoUpdater.autoInstallOnAppQuit = store.state.config.autoInstallOnAppQuit;
    autoUpdater.autoDownload = store.state.config.autoDownload;
    autoUpdater.allowPrerelease = store.state.config.allowPrerelease;

    store.dispatch('checkUpdate');
});
