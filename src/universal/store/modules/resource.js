import crypto from 'crypto';
import fs from 'fs-extra';
import paths from 'path';
import url from 'url';
import { ResourcePack, Forge, LiteLoader } from 'ts-minecraft';
import { net } from 'electron';
import { requireString, requireObject } from '../helpers/utils';
import base from './resource.base';

/**
 * 
 * @param {string} folder 
 * @param {crypto.Hash} hasher 
 */
async function hashFolder(folder, hasher) {
    const files = await fs.readdir(folder);
    for (const f of files) {
        const st = await fs.stat(f); // eslint-disable-line
        if (st.isDirectory()) {
            hashFolder(`${folder}/${f}`, hasher);
        } else {
            hasher.update(await fs.readFile()) // eslint-disable-line
        }
    }
    return hasher;
}

async function readHash(file) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(file)
            .pipe(crypto.createHash('sha1').setEncoding('hex'))
            .once('finish', function () { resolve(this.read()); });
    });
}


/**
 * @type {import('./resource').ResourceModule}
 */
const mod = {
    ...base,
    actions: {
        async load(context) {
            const files = await context.dispatch('readFolder', 'resources', { root: true });
            const contents = [];
            for (const file of files.filter(f => f.endsWith('.json'))) {
                const data = await context.dispatch('read', {
                    path: `resources/${file}`,
                    fallback: undefined,
                    type: 'json',
                }, { root: true });
                if (data) contents.push(data);
            }
            context.commit('resources', contents);
        },

        async refresh(context, payload) {
            const files = await context.dispatch('readFolder', 'resources', { root: true });
            /**
             * @type {import('./resource').Resource<any>[]}
             */
            const contents = [];
            const hashMismatch = [];
            const visited = {};

            /**
             * @param {string} resourceFile 
             */
            async function validateResource(resourceFile) {
                const basename = paths.basename(resourceFile);
                const ext = paths.extname(basename);
                const hash = paths.basename(ext);
                const metaFile = paths.join(context.rootState.root, 'resources', `${hash}.json`);
                const realHash = await readHash(resourceFile);
                if (realHash === hash) {
                    
                }
            }

            /**
             * @param {string} file 
             */
            async function validateFile(file) {
                const hash = paths.basename(file);
                visited[hash] = true;
                const metaFile = paths.join(context.rootState.root, 'resources', `${hash}.json`);
                try {
                    const data = await context.dispatch('read', {
                        path: `resources/${file}`,
                        type: 'json',
                    }, { root: true });
                    const resourceFile = paths.join(context.rootState.root, 'resources', `${hash}${data.ext}`);
                    if (hash === data.hash) {
                        const resourceHash = await readHash(resourceFile);
                        if (resourceHash === hash) {
                            contents.push(data);
                        } else { // data is corrputed

                        }
                    } else { // metadata file corrupted
                        await fs.unlink(metaFile);
                        if (await fs.exists(resourceFile)) {
                            await fs.move(resourceFile, '');
                        }
                    }
                } catch (e) {
                    console.error(`Cannot read resource [${hash}]. Maybe the resources are modified by others?`);
                    console.error(e);
                }
            }

            await Promise.all(files.filter(f => f.endsWith('.json')).map(validateFile));
        },

        save(context, { mutation, object }) { },

        remove(context, resource) {
            if (typeof resource === 'string') resource = context.getters.getResource(resource);
            if (!resource) return Promise.resolve();
            context.commit('remove', resource);
            return Promise.all([
                context.dispatch('delete', `resources/${resource.hash}.json`, { root: true }),
                context.dispatch('delete', `resources/${resource.hash}${resource.type}`, { root: true }),
            ]);
        },
        rename(context, payload) {
            requireObject(payload);
            requireString(payload.name);

            const resource = typeof payload.resource === 'string' ? context.getters.getResource(resource) : payload.resource;
            if (!resource) throw new Error('Cannot find resource');
            context.commit('rename', { domain: resource.domain, hash: resource.hash, name: payload.name });
            return context.dispatch('write', { path: `resources/${payload.resource.hash}.json`, data: JSON.stringify(payload.resource) }, { root: true });
        },

        importAll(context, all) {
            if (all instanceof Array) {
                return Promise.all(all.map(r => context.dispatch('import', r)));
            }
            return Promise.reject(new Error('Require argument be an array!'));
        },

        async import(context, { path, metadata = {} }) {
            requireString(path);

            const importTaskContext = await context.dispatch('task/createShallow', { name: 'resource.import' }, { root: true });
            const root = context.rootState.root;
            const source = {
                path,
                date: Date.now(),
                ...metadata,
            };

            let data;
            let ext;
            let hash;
            let name;
            let isDir = false;

            const theURL = url.parse(path);
            if (theURL.protocol === 'https:' || theURL.protocol === 'http:') {
                data = await new Promise((resolve, reject) => {
                    const req = net.request({ url: path, redirect: 'manual' });
                    const bufs = [];
                    req.on('response', (resp) => {
                        resp.on('error', reject);
                        resp.on('data', (chunk) => { bufs.push(chunk); });
                        resp.on('end', () => { resolve(Buffer.concat(bufs)); });
                    });
                    req.on('redirect', (code, method, redirectUrl, header) => {
                        name = paths.basename(redirectUrl, '.zip');
                        ext = paths.extname(redirectUrl);
                        req.followRedirect();
                    });

                    req.on('error', reject);
                    req.end();
                });

                hash = crypto.createHash('sha1').update(data).digest('hex').toString('utf-8');
            } else {
                name = paths.basename(paths.basename(path, '.zip'), '.jar');
                const status = await fs.stat(path);

                if (status.isDirectory()) {
                    isDir = true;
                    ext = '';
                    hash = (await hashFolder(path, crypto.createHash('sha1'))).digest('hex').toString('utf-8');
                } else {
                    data = await fs.readFile(path);
                    ext = paths.extname(path);
                    hash = crypto.createHash('sha1').update(data).digest('hex').toString('utf-8');
                }
            }

            importTaskContext.update(1, 4, 'resource.import.checkingfile');
            // take hash of dir or file

            const metaFile = paths.join(root, 'resources', `${hash}.json`);
            const dataFile = paths.join(root, 'resources', `${hash}${ext}`);

            // if exist, abort
            if (fs.existsSync(dataFile) && fs.existsSync(metaFile)) {
                importTaskContext.finish('resource.import.existed');
                return undefined;
            }

            // use parser to parse metadata
            importTaskContext.update(2, 4, 'resource.import.parsing');

            const parseIn = isDir ? path : data;

            const { meta, domain, type } = await Forge.meta(parseIn).then(meta => ({ domain: 'mods', meta, type: 'forge' }),
                _ => LiteLoader.meta(parseIn).then(meta => ({ domain: 'mods', meta, type: 'liteloader' }),
                    _ => ResourcePack.read(path, data).then(meta => ({ domain: 'resourcepacks', meta, type: 'resourcepack' }),
                        _ => ({ domain: undefined, meta: undefined, type: undefined }))));

            if (!domain || !meta) throw new Error(`Cannot parse ${path}.`);

            Object.freeze(source);
            Object.freeze(meta);

            // build resource
            const resource = {
                hash, name, ext, type, domain, metadata: meta, source,
            };

            console.log(`Import resource ${name}${ext}(${hash}) into ${domain}`);

            importTaskContext.update(3, 4, 'resource.import.storing');
            // write resource to disk
            await fs.ensureDir(paths.join(root, 'resources'));
            if (isDir) {
                await fs.copy(path, dataFile);
            } else {
                await fs.writeFile(dataFile, data);
            }
            importTaskContext.update(4, 4, 'resource.import.update');
            // store metadata to disk
            await fs.writeFile(paths.join(root, 'resources', `${hash}.json`), JSON.stringify(resource, undefined, 4));
            importTaskContext.finish();

            context.commit('resource', resource);

            return Promise.resolve();
        },

        async deploy(context, payload) {
            if (!payload) throw new Error('Require input a resource with minecraft location');

            const { resources, minecraft } = payload;
            if (!resources) throw new Error('Resources cannot be undefined!');
            if (!minecraft) throw new Error('Minecract location cannot be undefined!');

            const promises = [];
            for (const resource of resources) {
                /**
                * @type {Resource}
                */
                let res;
                if (typeof resource === 'string') res = context.getters.getResource(resource);
                else res = resource;

                if (!res) throw new Error(`Cannot find the resource ${resource}`);
                if (typeof res !== 'object' || !res.hash || !res.type || !res.domain || !res.name) {
                    throw new Error('The input resource object should be valid!');
                }
                promises.push(context.dispatch('link', {
                    src: `resources/${res.hash}${res.type}`,
                    dest: paths.join(minecraft, res.domain, res.name),
                }, { root: true }));
            }
            await Promise.all(promises);
        },

        async exports(context, payload) {
            const { resources, targetDirectory } = payload;

            const promises = [];
            for (const resource of resources) {
                let res;
                if (typeof resource === 'string') res = context.getters.getResource(resource);
                else res = resource;

                if (!res) throw new Error(`Cannot find the resource ${resource}`);
                promises.push(context.dispatch('exports', {
                    src: `resources/${res.hash}${res.type}`,
                    dest: `${targetDirectory}/${res.name}${res.type}`,
                }, { root: true }));
            }
            await Promise.all(promises);
        },

    },
};

export default mod;
