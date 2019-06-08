import { existsSync, promises as fs } from 'fs';
import paths from 'path';
import { ensureDir } from 'universal/utils/fs';

/**
 * @type {import('./io').IOModule}
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
    },
};

export default mod;
