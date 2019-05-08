import { promises as fs, existsSync } from 'fs';
import paths from 'path';
import { net, webContents, app } from 'electron';
import { ensureDir, copy, remove } from '../helpers/fs-utils';

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
                    resp.on('data', (chunk) => { bufs.push(chunk); });
                    resp.on('end', () => { resolve(Buffer.concat(bufs)); });
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
        readFolder(context, path) {
            if (!path) throw new Error('Path must not be undefined!');
            path = paths.join(context.rootState.root, path);
            return ensureDir(path).then(() => fs.readdir(path));
        },
        import(context, payload) {
            const { src, dest } = payload;
            const to = paths.join(context.rootState.root, dest);
            return copy(src, to);
        },

        exports(context, payload) {
            const { src, dest } = payload;
            const from = paths.join(context.rootState.root, src);
            return copy(from, dest);
        },

        link(context, payload) {
            const { src, dest } = payload;
            const from = paths.join(context.rootState.root, src);
            const to = paths.join(context.rootState.root, dest);
            return fs.link(from, to);
        },

        exists(context, file) {
            return existsSync(`${context.rootState.root}/${file}`);
        },
        existsAll(context, files) {
            return files.all(f => existsSync(`${context.rootState.root}/${f}`));
        },
        existsAny(context, files) {
            return files.some(f => existsSync(`${context.rootState.root}/${f}`));
        },

        write(context, payload) {
            let { path, data } = payload;
            if (!payload.external) path = paths.resolve(context.rootState.root, path);
            if (typeof data === 'object' && !(data instanceof Buffer)) data = JSON.stringify(data, undefined, 4);
            const parent = paths.dirname(path);
            return ensureDir(parent).then(() => fs.writeFile(path, data));
        },

        async delete(context, path) {
            path = paths.join(context.rootState.root, path);
            return remove(path);
        },

        async setPersistence(context, { path, data }) {
            const inPath = `${context.rootState.root}/${path}`;
            return fs.writeFile(inPath, JSON.stringify(data, null, 4), { encoding: 'utf-8' });
        },

        async getPersistence(context, { path }) {
            const inPath = `${context.rootState.root}/${path}`;
            if (!existsSync(inPath)) return undefined;
            return fs.readFile(inPath, { encoding: 'utf-8' }).then(JSON.parse).catch((_) => { });
        },

        async read(context, payload) {
            let { path } = payload;
            const { type, external, fallback } = payload;
            if (!external) path = paths.join(context.rootState.root, path);

            if (!existsSync(path)) {
                if (!fallback) {
                    return undefined;
                }
                if (!external) {
                    await fs.writeFile(path,
                        typeof fallback === 'object' && !(fallback instanceof Buffer)
                            ? JSON.stringify(fallback) : fallback);
                }
                return fallback;
            }
            try {
                const data = await fs.readFile(path);
                if (!type) return data;

                switch (type) {
                    case 'function': return type(data);
                    case 'string': return data.toString();
                    case 'json': return JSON.parse(data.toString());
                    default:
                        console.warn(`Unsupported type ${type}!`);
                        return data;
                }
            } catch (e) {
                if (fallback) {
                    await fs.writeFile(path, typeof fallback === 'object' && !(fallback instanceof Buffer)
                        ? JSON.stringify(fallback)
                        : fallback);
                    return fallback;
                }
                return undefined;
            }
        },
    },
};

export default mod;
