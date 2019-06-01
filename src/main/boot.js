import {
    app, ipcMain,
} from 'electron';

import { promises as fs, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { copy } from 'universal/utils/fs';

const appData = app.getPath('appData');
const persistRoot = `${appData}/voxelauncher`;
const cfgFile = `${appData}/voxelauncher/launcher.json`;

ipcMain.on('root', handleRootChange);

async function handleRootChange(event, { path: newRoot, migrate, clear }) {
    const oldRoot = app.getPath('userData');
    if (oldRoot === newRoot) {
        event.sender.send('root');
        return;
    }

    console.log(`Start to migrate root, ${oldRoot} -> ${newRoot}`);

    async function remove(file) {
        const s = await fs.stat(file).catch((_) => { });
        if (!s) return;
        if (s.isDirectory()) {
            const childs = await fs.readdir(file);
            await Promise.all(childs.map(p => path.resolve(file, p)).map(p => remove(p)));
            if (file === persistRoot) return;
            await fs.rmdir(file);
        } else {
            if (file === cfgFile) return;
            await fs.unlink(file);
        }
    }

    try {
        if (!existsSync(newRoot)) {
            mkdirSync(newRoot, { recursive: true });
        }

        if (migrate) {
            await copy(oldRoot, newRoot);
        }

        if (clear) {
            await remove(oldRoot);
        }

        await fs.writeFile(cfgFile, JSON.stringify({ path: newRoot }));

        app.setPath('userData', newRoot);
        app.relaunch();
        app.quit();
    } catch (e) {
        console.error(`Error occured during migrating, path: ${newRoot}, migrate: ${migrate}, clear: ${clear}.`);
        console.error(e);
        event.sender.send('root', e);
    }
}

function setupRoot(newRoot, oldRoot) {
    if (newRoot === oldRoot) return;
    app.setPath('userData', newRoot);
    if (!existsSync(newRoot)) {
        mkdirSync(newRoot, { recursive: true });
    }
    if (!existsSync(persistRoot)) {
        mkdirSync(persistRoot, { recursive: true });
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
        root = cfg.path || path.join(appData, 'voxelauncher');
    } catch (e) {
        root = path.join(appData, 'voxelauncher');
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
