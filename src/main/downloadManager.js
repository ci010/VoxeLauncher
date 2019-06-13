import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import Task from 'treelike-task';
import { Store } from 'vuex';

/**
 * @param {Store<any>} store 
 * @param {BrowserWindow} window guard window
 */
export default function setup(store, window) {
    window.webContents.session.on('will-download', (event, item, contents) => {
        const downloadTask = Task.create('download', (context) => {
            const savePath = join(app.getPath('userData'), 'temps', item.getFilename());
            if (!item.getSavePath()) item.setSavePath(savePath);

            return new Promise((resolve, reject) => {
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
            });
        });
        store.dispatch('executeTask', downloadTask);
    });

    store.dispatch('downloadFile', 'https://raw.githubusercontent.com/electron/electron/master/docs/api/protocol.md');
}
