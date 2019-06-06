import { app, BrowserWindow, ipcMain, shell } from 'electron';
import ipc from './ipc';
import getTray from './trayManager';

const headless = process.env.HEADLESS || false;

const isDev = process.env.NODE_ENV === 'development';
const baseURL = isDev
    ? 'http://localhost:9080/'
    : `file://${__dirname}/`;
/**
 * A map to keep running browser
 * @type {{[name: string] : BrowserWindow}}
 */
let windows = {};
/**
 * ref for if the game is launching and the launcher is paused
 * @type {boolean}
 */
let parking;

/**
 * instance of client
 * @type {import('setup').Instance?}
 */
let instance;

/**
 * Create a window 
 * @param {string} name
 * @param {import('electron').BrowserViewConstructorOptions} option
 */
function createWindow(name, option) {
    const ref = new BrowserWindow(option);
    ref.loadURL(`${baseURL}${name}`);
    console.log(`Create window from ${`${baseURL}${name}`}`);
    ref.webContents.on('will-navigate', (event, url) => {
        if (isDev) {
            if (!url.startsWith('http://localhost')) {
                event.preventDefault();
                shell.openExternal(url);
            }
        } else {
            event.preventDefault();
            shell.openExternal(url);
        }
    });
    windows[name] = ref;
    ref.on('close', () => { delete windows[name]; });
    return ref;
}

/**
 * 
 * @param {import('setup').Setup} client 
 * @param {import('vuex').Store<import('universal/store/store').RootState>} store 
 */
function setupClient(client, store) {
    parking = true;
    const tray = getTray();

    if (instance) { // stop current client if exist
        try {
            instance.dispose();
        } catch (e) {
            console.warn(`An error occure during dispose ${client}`);
            console.error(e);
        }
        for (const channel of Object.keys(instance.listeners)) {
            for (const lis of instance.listeners[channel]) {
                ipcMain.removeListener(channel, lis);
            }
        }
        if (tray) {
            tray.removeAllListeners();
        }
        windows = {};
        BrowserWindow.getAllWindows().forEach(win => win.close());
        instance = null;
    }
    /**
     * @type {import('setup').Instance["listeners"]}
     */
    const listeners = {};

    const hook = client({
        createWindow,
        ipcMain: {
            /**
             * @param {string} channel
             * @param {Function} func
             */
            on(channel, func) {
                if (!listeners[channel]) listeners[channel] = [];
                listeners[channel].push(func);
                return ipcMain.addListener(channel, func);
            },
        },
        configTray(func) {
            if (tray) { func(tray); }
            return this;
        },
        configDock(func) {
            if (app.dock) {
                func(app.dock);
            }
            return this;
        },
    }, store);

    const newInstance = {
        ...hook,
        listeners,
    };
    instance = newInstance;

    parking = false;
}

ipc
    .on('exit', () => { app.quit(); })
    .on('minecraft-start', () => { parking = true; })
    .on('minecraft-exit', () => { parking = false; })
    .on('store-ready', (store) => {
        if (headless) return;
        import('./material').then(c => c.default).then((c) => {
            if (app.isReady()) {
                setupClient(c, store);
                return;
            }
            app.once('ready', () => {
                setupClient(c, store);
            });
        });
    });

app
    .on('window-all-closed', () => {
        if (parking) return;
        if (process.platform !== 'darwin') { app.quit(); }
    })
    .on('second-instance', () => { if (instance) instance.requestFocus(); });
