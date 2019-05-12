import { app, Menu, Tray, dialog } from 'electron';


let tray = null;
app.on('ready', () => {
    tray = new Tray('./static/logo.png');
    const contextMenu = Menu.buildFromTemplate([
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
    ]);
    tray.setToolTip('The Minecraft launcher');
    tray.setContextMenu(contextMenu);
});
