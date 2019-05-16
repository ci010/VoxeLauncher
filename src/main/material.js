
import { ipcMain } from 'electron';

export default function setup(context, store) {
    /**
     * @type { import('electron').BrowserWindow }
     */
    let profileRef;

    function createProfileWindow() {
        profileRef = context.createWindow('index.html?window=profile', {
            title: 'profile',
            width: 770,
            height: 580,
            resizable: false,
            frame: false,
            transparent: true,
            hasShadow: false,
            maximizable: false,
            icon: './static/apple-touch-icon.png',
            // nodeIntegration: false,
        });
        ipcMain.on('minecraft-exit', (status) => {
            profileRef.webContents.send('minecraft-exit', status);
        });
        ipcMain.on('minecraft-stdout', (out) => {
            if (out.indexOf('Reloading ResourceManager') !== -1 || out.indexOf('LWJGL Version: ') !== -1) {
                profileRef.webContents.send('minecraft-window-ready');
                profileRef.hide();
            }
        });
    }

    ipcMain
        .on('window-open', (event, id) => {
            switch (id) {
                case 'profile': createProfileWindow(); break;
                default:
            }
        })
        .on('minecraft-exit', () => {
            const { showLog, hideLauncher } = store.getters['profile/current'];
            if (hideLauncher) { profileRef.show(); }
        })
        .on('window-close', (event) => {
            // event.sender.close();
        });

    createProfileWindow();

    return {
        requestFocus() {
        },
        dispose() {
        },
    };
}
