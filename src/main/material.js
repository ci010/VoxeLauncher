
import { ipcMain } from 'electron';

export default function setup(context, store) {
    /**
     * @type { import('electron').BrowserWindow }
     */
    let profileRef;

    function createLoginWindow() {
        context.createWindow('login', {
            width: 300,
            height: 480,
            resizable: false,
            frame: false,
            transparent: true,
            hasShadow: false,
            nodeIntegration: false,
        });
    }

    function createProfileWindow() {
        profileRef = context.createWindow('index.html?window=profile', {
            title: 'profile',
            width: 720,
            height: 580,
            resizable: false,
            frame: false,
            transparent: true,
            hasShadow: false,
            nodeIntegration: false,
        });
    }

    ipcMain
        .on('window-open', (event, id) => {
            switch (id) {
                case 'profile': createProfileWindow(); break;
                case 'login': createLoginWindow(); break;
                default:
            }
        })
        .on('minecraft-exit', () => {
            const { showLog, hideLauncher } = store.getters['profile/current'];
            if (hideLauncher) { profileRef.show(); }
        })
        .on('minecraft-start', () => {
            const { showLog, hideLauncher } = store.getters['profile/current'];
            if (hideLauncher) { profileRef.hide(); }
        })
        .on('window-close', (event) => {
            // event.sender.close();
        });

    if (!store.getters['user/logined']) {
        createLoginWindow();
    } else {
        createProfileWindow();
    }

    return {
        requestFocus() {
        },
        dispose() {
        },
    };
}
