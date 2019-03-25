import fs from 'fs-extra';
import paths from 'path';
import { ActionContext } from 'vuex';
import { net, webContents, app } from 'electron';

/**
 * @type {import('./io').IOModule}
 */
const mod = {
    actions: {
        request(context, url) {
            return new Promise((resolve, reject) => {
                const req = net.request(url);
                const bufs = [];
                req.on('response', (resp) => {
                    resp.on('error', reject);
                    resp.on('data', (chunk) => {
                        bufs.push(chunk);
                    });
                    resp.on('end', () => {
                        resolve(Buffer.concat(bufs));
                    });
                });
                req.on('error', reject);
                req.end();
            });
        },
        async download(context, payload) {
            const { url } = payload;
            const content = webContents.getFocusedWebContents();
            const proxy = await context.dispatch('task/create',
                { name: 'download' },
                { root: true });

            try {
                const file = await new Promise((resolve, reject) => {
                    content.session.once('will-download', (event, item, $content) => {
                        const savePath = paths.join(app.getPath('userData'), 'temps', item.getFilename());
                        if (!this.file) item.setSavePath(savePath);
                        item.on('updated', (e) => {
                            proxy.update(item.getReceivedBytes(), item.getTotalBytes());
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
                    content.downloadURL(url);
                });
                proxy.finish();
            } catch (e) {
                proxy.finish(Object.freeze(e));
            }
        },
        readFolder(context, payload) {
            let { path } = payload;
            if (!path) throw new Error('Path must not be undefined!');
            path = paths.join(context.rootState.root, path);
            return fs.ensureDir(path).then(() => fs.readdir(path));
        },
        delete(context, path) {
            path = paths.join(context.rootState.root, path);
            return fs.remove(path);
        },
        /**
          * @param {ActionContext} context 
          * @param {{ file: string, toFolder: string, name: string }} payload 
          */
        import(context, payload) {
            const { file, toFolder, name } = payload;
            const to = paths.join(context.rootState.root, toFolder, name || paths.basename(file));
            return fs.copy(file, to);
        },
        /**
         * 
         * @param {ActionContext} context 
         * @param {{ file:string, toFolder:string, name:string, mode:string }} payload 
         */
        exports(context, payload) {
            const { file, toFolder, name, mode } = payload;
            const $mode = mode || 'copy';
            const from = paths.join(context.rootState.root, file);
            const to = paths.join(toFolder, name || paths.basename(file));
            if ($mode === 'link') return fs.link(from, to);
            return fs.copy(from, to);
        },
        /**
         * @param {ActionContext} context 
         * @param {{ path: string, data: Buffer | string | any, external?: boolean }} payload 
         */
        write(context, payload) {
            let { path, data } = payload;
            if (!payload.external) path = paths.resolve(context.rootState.root, path);
            if (typeof data === 'object' && !(data instanceof Buffer)) data = JSON.stringify(data, undefined, 4);
            const parent = paths.dirname(path);
            return fs.ensureDir(parent).then(() => fs.writeFile(path, data));
        },
        /**
         * 
         * @param {ActionContext} context 
         * @param {string | string[]} files 
         */
        exist(context, files) {
            if (typeof files === 'string') files = [files];
            for (const p of files) if (!fs.existsSync(`${context.rootState.root}/${p}`)) return false;
            return true;
        },

        /**
         * @param {ActionContext} context 
         * @param {{ path: string, fallback: string | Buffer, type: 'string' | 'json' | ((buf: Buffer) => any), external?: boolean}} payload 
         */
        async read(context, payload) {
            let { path, fallback } = payload;
            const { type, external } = payload;
            if (!external) path = paths.join(context.rootState.root, path);

            if (!fs.existsSync(path)) {
                if (fallback) {
                    if (!external) {
                        await fs.writeFile(path, typeof fallback === 'object' && !(fallback instanceof Buffer)
                            ? JSON.stringify(fallback)
                            : fallback);
                    }
                    return fallback;
                }
                return undefined;
            }
            try {
                const data = await fs.readFile(path);
                if (!type) return data;
                if (typeof type === 'function') return type(data);
                switch (type) {
                    case 'string': return data.toString();
                    case 'json': return JSON.parse(data.toString());
                    default:
                        console.warn(`Unsupported type ${type}!`);
                        return data;
                }
            } catch (e) {
                if (fallback) {
                    const fallData = fallback;
                    if (typeof fallback === 'object' && !(fallback instanceof Buffer)) fallback = JSON.stringify(fallback);
                    await fs.writeFile(path, fallback);
                    return fallData;
                }
                return undefined;
            }
        },
    },
};

export default mod;
