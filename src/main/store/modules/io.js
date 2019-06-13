import { app } from 'electron';
import { existsSync, promises as fs } from 'fs';
import paths, { join } from 'path';
import Task from 'treelike-task';
import { ensureDir } from 'main/utils/fs';
import { getGuardWindow } from '../../windowsManager';

/**
 * @type {{[url: string]: Promise<string>}}
 */
const downloadingGuard = {};
/**
 * @type {import('universal/store/modules/io').IOModule}
 */
const mod = {
    actions: {
        async readFolder(context, path) {
            if (!path) throw new Error('Path must not be undefined!');
            path = paths.join(context.rootState.root, path);
            await ensureDir(path);
            return fs.readdir(path);
        },

        async setPersistence(context, { path, data }) {
            const inPath = `${context.rootState.root}/${path}`;
            return fs.writeFile(inPath, JSON.stringify(data, null, 4), { encoding: 'utf-8' });
        },

        async getPersistence(context, { path }) {
            const inPath = `${context.rootState.root}/${path}`;
            if (!existsSync(inPath)) return undefined;
            return fs.readFile(inPath, { encoding: 'utf-8' }).then(s => JSON.parse(s.toString())).catch(() => { });
        },
        async electronDownloadFile(context, payload) {
            const win = getGuardWindow();
            if (!win) {
                throw new Error('Downloader Not Ready');
            }
            win.webContents.downloadURL(payload.url);
            return new Promise((resolve, reject) => {
                win.webContents.session.once('will-download', (event, item, contents) => {
                    const savePath = join(app.getPath('userData'), 'temps', item.getFilename());
                    if (!item.getSavePath()) item.setSavePath(savePath);
                    const downloadTask = Task.create('download', context => new Promise((resolve, reject) => {
                        item.on('updated', (e) => {
                            context.update(item.getReceivedBytes(), item.getTotalBytes(), item.getURL());
                        });
                        item.on('done', ($event, state) => {
                            switch (state) {
                                case 'completed':
                                    resolve(savePath);
                                    break;
                                case 'cancelled':
                                case 'interrupted':
                                default:
                                    reject(new Error(state));
                                    break;
                            }
                        });
                    }));
                    context.dispatch('executeTask', downloadTask)
                        .then(handle => resolve(handle));
                });
            });
        },
    },
};

export default mod;
