import { autoUpdater, UpdaterSignal } from 'electron-updater';
import { ipcMain } from 'electron';

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

    store.dispatch('config/checkUpdate').catch((e) => {
    });

    const signal = new UpdaterSignal(autoUpdater);
    signal.updateDownloaded((info) => {

    });
    signal.progress((info) => {

    });

    autoUpdater.on('error', (err) => {
    });

    let taskHandle;
    autoUpdater.on('download-progress', (progressObj) => {

        // let logMessage = `Download speed: ${progressObj.bytesPerSecond}`;
        // logMessage = `${logMessage} - Downloaded ${progressObj.percent}%`;
        // logMessage = `${logMessage} (${progressObj.transferred}/${progressObj.total})`;
        // sendStatusToWindow(logMessage);
    });
    autoUpdater.on('update-downloaded', (info) => {
    });
});
