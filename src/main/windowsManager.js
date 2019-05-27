import { app, BrowserWindow, ipcMain, shell } from 'electron';
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
const windows = {};
/**
 * ref for if the game is launching and the launcher is paused
 * @type {boolean}
 */
let parking;

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


function setupClient(client, store) {
    parking = true;

    if (instance) { // stop current client if exist
        try {
            instance.dispose();
        } catch (e) {
            console.warn(`An error occure during dispose ${client}`);
            console.error(e);
        }
        for (const key of Object.key(instance.listeners)) {
            for (const lis of instance.listeners[key]) {
                ipcMain.removeListener(key, lis);
            }
        }
        getTray().removeAllListeners();
        BrowserWindow.getAllWindows().forEach(win => win.close());
        instance = undefined;
    }
    const listeners = {};

    instance = client({
        createWindow,
        ipcMain: {
            on(channel, func) {
                if (!listeners[channel]) listeners[channel] = [];
                listeners[channel].push(func);
                return ipcMain.addListener(channel, func);
            },
        },
        configTray(func) {
            func(getTray());
        },
        configDock(func) {
            if (app.dock) {
                func(app.dock);
            }
        },
    }, store);
    instance.listeners = listeners;

    parking = false;
}

ipcMain
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
