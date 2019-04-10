import { app, BrowserWindow, ipcMain } from 'electron';

const headless = process.env.HEADLESS || false;

const baseURL = process.env.NODE_ENV === 'development'
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
    windows[name] = ref;
    ref.on('close', () => { delete windows[name]; });
    return ref;
}

/**
 * @param {string} name 
 */
function getWindow(name) {
    return windows[name];
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
        BrowserWindow.getAllWindows().forEach(win => win.close());
        instance = undefined;
    }

    instance = client({ createWindow }, store);

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
    .on('second-instance', () => { instance.requestFocus(); });
