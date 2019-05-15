import { autoUpdater, UpdaterSignal } from 'electron-updater';
import { ipcMain } from 'electron';

ipcMain.on('store-ready', (store) => {
    store.watch(state => state.config.allowPrerelease, (allowPrerelease) => {
        autoUpdater.allowPrerelease = store.state.config.allowPrerelease;
    });

    console.log(`Current version is ${autoUpdater.currentVersion.raw}`);

    autoUpdater.autoInstallOnAppQuit = store.state.config.autoInstallOnAppQuit;
    autoUpdater.autoDownload = store.state.config.autoDownload;
    autoUpdater.allowPrerelease = store.state.config.allowPrerelease;

    autoUpdater.checkForUpdates();

    const signal = new UpdaterSignal(autoUpdater);
    signal.updateDownloaded((info) => {

    });
    signal.progress((info) => {

    });
    let taskHandle;

    let checkTaskHandle;
    autoUpdater.on('checking-for-update', () => {
        checkTaskHandle = store.dispatch('task/createShallow', { name: 'checkUpdate' });
    });
    autoUpdater.on('update-available', (info) => {
    });
    autoUpdater.on('update-not-available', (info) => {
    });
    autoUpdater.on('error', (err) => {
    });
    autoUpdater.on('download-progress', (progressObj) => {
        let logMessage = `Download speed: ${progressObj.bytesPerSecond}`;
        logMessage = `${logMessage} - Downloaded ${progressObj.percent}%`;
        logMessage = `${logMessage} (${progressObj.transferred}/${progressObj.total})`;
        // sendStatusToWindow(logMessage);
    });
    autoUpdater.on('update-downloaded', (info) => {
    });
});
