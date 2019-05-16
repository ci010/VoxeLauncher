import {
    app, ipcMain,
} from 'electron';

import { promises as fs, existsSync, mkdirSync } from 'fs';
import path from 'path';

const appData = app.getPath('appData');
const cfgFile = `${appData}/launcher.json`;

ipcMain.on('store-ready', (store) => {
    store.watch(state => state.root, setupRoot);
});

function setupRoot(newRoot, oldRoot) {
    if (newRoot === oldRoot) return;
    app.setPath('userData', newRoot);
    if (!existsSync(newRoot)) {
        mkdirSync(newRoot, { recursive: true });
    }
    ipcMain.emit('reload');
    console.log(`Setup root ${newRoot}`);
    fs.writeFile(cfgFile, JSON.stringify({ path: newRoot }));
}

async function loadRoot() {
    let root;
    try {
        const buf = await fs.readFile(cfgFile);
        const cfg = JSON.parse(buf.toString());
        root = cfg.path || path.join(appData, '.launcher');
    } catch (e) {
        root = path.join(appData, '.launcher');
    }
    return root;
}

loadRoot().then((root) => {
    setupRoot(root, undefined);
}).catch((e) => {
    console.error('An error occured during setup root');
    console.error(e);
    app.exit(1);
});
