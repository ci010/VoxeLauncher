import { app, Menu, Tray, dialog, ipcMain, nativeImage } from 'electron';
import i18n from './i18n';

/**
 * @type {Tray?}
 */
let tray = null;

app.on('before-quit', () => {
    if (tray !== null) {
        tray.destroy();
    }
});
app.on('ready', () => {
    const img = nativeImage.createFromPath(`${__static}/favicon.png`);
    tray = new Tray(img);

    function createMenu() {
        return Menu.buildFromTemplate([
            { type: 'normal', label: i18n.t('launcher.checkUpdate').toString() },
            { type: 'separator' },
            {
                label: i18n.t('launcher.showDiagnosis').toString(),
                type: 'normal',
                click() {
                    const cpu = process.getCPUUsage();
                    const mem = process.getProcessMemoryInfo();
                    const sysmem = process.getSystemMemoryInfo();

                    /**
                     * @type {Promise<Electron.ProcessMemoryInfo>}
                     */
                    const p = mem instanceof Promise ? mem : Promise.resolve(mem);
                    p.then((m) => {
                        dialog.showMessageBox({
                            type: 'info',
                            title: 'Diagnosis Info',
                            message: `CPU: ${JSON.stringify(cpu)}\nMem: ${JSON.stringify(m)}\nSysMem: ${JSON.stringify(sysmem)}`,
                        });
                    });
                },
            },
            { type: 'separator' },
            {
                label: i18n.t('launcher.quit').toString(),
                type: 'normal',
                click(item, window, event) {
                    app.quit();
                },
            },
        ]);
    }

    tray.setContextMenu(createMenu());

    ipcMain.on('locale-changed', () => {
        if (tray) {
            tray.setToolTip(i18n.t('launcher.title').toString());
            tray.setContextMenu(createMenu());
        }
    });
});

export default function getTray() {
    return tray;
}
