import { app, Menu, Tray } from 'electron';

let tray = null;
app.on('ready', () => {
    tray = new Tray('./static/logo.png');
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Check for Updates', type: 'normal' },
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
