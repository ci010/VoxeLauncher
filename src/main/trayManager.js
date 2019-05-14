import { app, Menu, Tray, dialog, ipcMain, nativeImage } from 'electron';
import i18n from './i18n';

let tray = null;
app.on('ready', () => {
    const img = nativeImage.createFromPath('./static/favicon-16x16.png');
    tray = new Tray(img);
    const template = [
        { label: 'Check for Updates', type: 'normal' },
        { type: 'separator' },
        {
            label: 'Show Diagnosis',
            type: 'normal',
            click() {
                const cpu = process.getCPUUsage();
                const mem = process.getProcessMemoryInfo();
                const sysmem = process.getSystemMemoryInfo();

                mem.then((m) => {
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
            label: 'Quit Launcher',
            type: 'normal',
            click(item, window, event) {
                app.quit();
            },
        },
    ];
    const contextMenu = Menu.buildFromTemplate(template);
    tray.setToolTip('The Minecraft launcher');
    tray.setContextMenu(contextMenu);

    ipcMain.on('locale-changed', () => {
        tray.setToolTip(i18n.t('launcher.title'));
        template[0].label = i18n.t('launcher.checkUpdate');
        template[2].label = i18n.t('launcher.showDiagnosis');
        template[4].label = i18n.t('launcher.quit');
        tray.setContextMenu(Menu.buildFromTemplate(template));
    });
});
