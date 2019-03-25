import { app, BrowserWindow, ipcMain } from 'electron';


let parking; // ref for if the game is launching and the launcher is paused
let instance; // current theme manager

export default function setup(winURL) {
    let logWindow; // log win ref
    let loginWinRef; // login window ref
    let profileWinRef; // profile window ref
    let userWinRef; // user window ref
    let marketWinRef; // market window ref
    let parking; // ref for if the game is launching and the launcher is paused

    function createUserWindow() {
        userWinRef = new BrowserWindow({
            width: 300,
            height: 680,
            resizable: false,
            frame: false,
            transparent: true,
        });
        userWinRef.setResizable(false);
        userWinRef.loadURL(`${winURL}?window=user`);
        userWinRef.on('close', () => { userWinRef = undefined; });
        ipcMain.on('user/close', () => {
            userWinRef.close();
        });
    }
    function createLoginWindow() {
        loginWinRef = new BrowserWindow({
            width: 300,
            height: 480,
            resizable: false,
            frame: false,
            transparent: true,
        });
        loginWinRef.setResizable(false);
        loginWinRef.loadURL(`${winURL}?window=login`);
        loginWinRef.on('close', () => { loginWinRef = undefined; });
    }

    function createProfileWindow() {
        profileWinRef = new BrowserWindow({
            width: 700,
            height: 580,
            resizable: false,
            frame: false,
            transparent: true,
        });
        profileWinRef.setResizable(false);
        profileWinRef.loadURL(`${winURL}?window=profile`);
        profileWinRef.on('close', () => { profileWinRef = undefined; });
    }
    function createSettingWindow() {

    }

    createLoginWindow();
    // createUserWindow();
    // createProfileWindow();

    return {
        dispose() {
        },
    };
}


function setupWindow(client) {
    parking = true;

    if (typeof newSetup !== 'function') throw new Error('Require theme export default is a async function');
    if (instance) { // stop current theme if exist
        console.log('dispose current theme');
        try {
            instance.dispose();
        } catch (e) {
            console.warn(`An error occure during dispose ${client}`);
            console.error(e);
        }
        BrowserWindow.getAllWindows().forEach(win => win.close());
        instance = undefined;
    }

    instance = setup(process.env.NODE_ENV === 'development' ?
        `http://localhost:9080/${client}.html` :
        `file://${__dirname}/${client}.html`);

    console.log('instance');
    console.log(instance);

    parking = false;
}

app.on('window-all-closed', () => {
    if (parking) return;
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
ipcMain.on('exit', () => {
    app.quit();
});
ipcMain.on('minecraft-exit', () => {
    parking = false;
});
ipcMain.on('minecraft-start', () => {
    parking = true;
});
ipcMain.on('store-ready', (store) => {
    if (app.isReady()) {
        setupWindow(store.state.config.theme || 'semantic');
    } else {
        app.once('ready', () => {
            setupWindow(store.state.config.theme || 'semantic');
        });
    }
    // store.commit('config/themes', Object.keys(themes));
    // store.watch(state => state.config.theme, setupWindow);
});
