import crypto from 'crypto';
import { net } from 'electron';
import { createReadStream, existsSync, promises as fs } from 'fs';
import { copy, ensureDir, ensureFile } from 'main/utils/fs';
import paths from 'path';
import { Forge, LiteLoader, ResourcePack } from 'ts-minecraft';
import base from 'universal/store/modules/resource';
import { requireString } from 'universal/utils/object';
import url from 'url';
import { bufferEntry, open, parseEntries } from 'yauzlw';

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
            hasher.update(await fs.readFile(`${folder}/${f}`)) // eslint-disable-line
        }
    }
    return hasher;
}

/**
 * 
 * @param {string} file 
 */
async function readHash(file) {
    return new Promise((resolve, reject) => {
        createReadStream(file)
            .pipe(crypto.createHash('sha1').setEncoding('hex'))
            // @ts-ignore
            .once('finish', function () { resolve(this.read()); });
    });
}

/**
 * 
 * @param {string} type 
 * @param {any} meta 
 */
function getRegularName(type, meta) {
    let fmeta;
    switch (type) {
        case 'forge':
            fmeta = meta[0];
            if (typeof (fmeta.name || fmeta.modid) !== 'string'
                || typeof fmeta.mcversion !== 'string'
                || typeof fmeta.version !== 'string') return undefined;
            return `${fmeta.name || fmeta.modid}-${fmeta.mcversion}-${fmeta.version}`;
        case 'liteloader':
            if (typeof meta.name !== 'string'
                || typeof meta.mcversion !== 'string'
                || typeof meta.revision !== 'number') return undefined;
            return `${meta.name}-${meta.mcversion}-${meta.revision}`;
        case 'resourcepack':
            return meta.packName;
        default:
            return 'Unknown';
    }
}
/**
 * 
 * @param {string} filename 
 * @param {string} hash 
 * @param {string} ext 
 * @param {Buffer} data 
 * @param {object} source 
 * @return {Promise<import('universal/store/modules/resource').Resource<any>>}
 */
async function parseResource(filename, hash, ext, data, source) {
    const { meta, domain, type } = await Forge.meta(data).then(meta => ({ domain: 'mods', meta, type: 'forge' }),
        _ => LiteLoader.meta(data).then(meta => ({ domain: 'mods', meta, type: 'liteloader' }),
            _ => ResourcePack.read(filename, data).then(meta => ({ domain: 'resourcepacks', meta, type: 'resourcepack' }),
                e => ({ domain: undefined, meta: undefined, type: undefined, error: e }))));

    if (!domain || !meta || !type) throw new Error(`Cannot parse ${filename}.`);

    Object.freeze(source);
    Object.freeze(meta);

    return {
        path: '',
        name: getRegularName(type, meta) || paths.basename(paths.basename(filename, '.zip'), '.jar'),
        hash,
        ext,
        metadata: meta,
        domain,
        type,
        source,
    };
}


/**
 * @type {{[key: string]: string}}
 */
const cache = {};
/**
 * @type {import('universal/store/modules/resource').ResourceModule}
 */
const mod = {
    ...base,
    actions: {
        async load(context) {
            const resources = await fs.readdir(context.rootGetters.path('resources'));
            context.commit('resources', await Promise.all(resources
                .map(file => context.rootGetters.path('resources', file))
                .map(file => fs.readFile(file).then(b => JSON.parse(b.toString())))));
        },
        async init(context) {
            context.dispatch('refreshResources');
        },
        async refreshResources(context) {
            const taskId = await context.dispatch('spawnTask', 'refreshResource');

            const modsDir = context.rootGetters.path('mods');
            const resourcepacksDir = context.rootGetters.path('resourcepacks');
            await ensureDir(modsDir);
            await ensureDir(resourcepacksDir);
            const modsFiles = await fs.readdir(modsDir);
            const resourcePacksFiles = await fs.readdir(resourcepacksDir);

            const touched = {};
            let finished = 0;
            const emptyResource = { path: '', name: '', hash: '', ext: '', metadata: {}, domain: '', type: '', source: { path: '', date: '' } };
            /**
             * @param {string} file
             * @return {Promise<import('universal/store/modules/resource').Resource<any>>}
             */
            async function reimport(file) {
                try {
                    const hash = await readHash(file);
                    const metaFile = paths.join('resources', `${hash}.json`);

                    Reflect.set(touched, `${hash}.json`, true);
                    const metadata = await context.dispatch('getPersistence', { path: metaFile });
                    if (!metadata) {
                        const ext = paths.extname(file);
                        const name = paths.basename(file, ext);

                        const resource = await parseResource(file, hash, ext, await fs.readFile(file), {
                            name,
                            path: paths.resolve(file),
                            date: Date.now(),
                        });

                        resource.path = file;

                        await context.dispatch('setPersistence', { path: metaFile, data: resource });
                        finished += 1;
                        context.dispatch('updateTask', { id: taskId, progress: finished });
                        return resource;
                    }
                    return metadata;
                } catch (e) {
                    finished += 1;
                    context.dispatch('updateTask', { id: taskId, progress: finished });

                    console.error(`Cannot resolve resource file ${file}.`);
                    console.error(e);
                }
                return emptyResource;
            }

            const allPromises = modsFiles.map(file => context.rootGetters.path('mods', file))
                .concat(resourcePacksFiles.map(file => context.rootGetters.path('resourcepacks', file)))
                .map(reimport);

            context.dispatch('updateTask', { id: taskId, progress: 0, total: allPromises.length });
            const resources = await Promise.all(allPromises);

            const metaFiles = await context.dispatch('readFolder', 'resources');

            for (const metaFile of metaFiles) {
                if (!Reflect.has(touched, metaFile)) {
                    await fs.unlink(context.rootGetters.path('resources', metaFile));
                }
            }

            if (resources.length > 0) {
                context.commit('resources', resources.filter(resource => resource !== emptyResource));
            }
            context.dispatch('finishTask', { id: taskId });
        },

        async removeResource(context, resource) {
            const resourceObject = typeof resource === 'string' ? context.getters.getResource(resource) : resource;
            if (!resourceObject) return;
            context.commit('removeResource', resourceObject);
            await Promise.all([
                fs.unlink(context.rootGetters.path('resources', `${resourceObject.hash}.json`)),
                fs.unlink(context.rootGetters.path(resourceObject.domain, `${resourceObject.name}${resourceObject.ext}`)),
            ]);
        },

        async readForgeLogo(context, resourceId) {
            requireString(resourceId);
            if (typeof cache[resourceId] === 'string') return cache[resourceId];
            const res = context.state.mods[resourceId];
            if (res.type !== 'forge') {
                throw new Error(`The resource should be forge but get ${res.type}`);
            }
            const meta = res.metadata[0];
            if (!meta.logoFile) {
                cache[resourceId] = '';
                return '';
            }
            const zip = await open(res.path, { lazyEntries: true, autoClose: false });
            const { [meta.logoFile]: logo } = await parseEntries(zip, [meta.logoFile]);
            if (logo) {
                const buffer = await bufferEntry(zip, logo);
                const data = buffer.toString('base64');
                cache[resourceId] = data;
                return data;
            }
            cache[resourceId] = '';
            return '';
        },

        async importResource(context, { path, metadata = {} }) {
            requireString(path);

            const handle = await context.dispatch('spawnTask', 'resource.import');
            const root = context.rootState.root;

            let data;
            let ext = '';
            let hash;
            let name;
            let isDir = false;

            const theURL = url.parse(path);
            if (theURL.protocol === 'https:' || theURL.protocol === 'http:') {
                data = await new Promise((resolve, reject) => {
                    const req = net.request({ url: path, redirect: 'manual' });
                    /**
                     * @type {Buffer[]}
                     */
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

                hash = crypto.createHash('sha1').update(data).digest('hex');
            } else {
                name = paths.basename(paths.basename(path, '.zip'), '.jar');
                const status = await fs.stat(path);

                if (status.isDirectory()) {
                    isDir = true;
                    ext = '';
                    hash = (await hashFolder(path, crypto.createHash('sha1'))).digest('hex');
                } else {
                    data = await fs.readFile(path);
                    ext = paths.extname(path);
                    hash = crypto.createHash('sha1').update(data).digest('hex');
                }
            }

            const source = {
                name,
                path: paths.resolve(path),
                date: Date.now(),
                ...metadata,
            };

            context.dispatch('updateTask', { id: handle, progress: 1, total: 4, message: 'resource.import.checkingfile' });

            // take hash of dir or file
            await ensureDir(paths.join(root, 'resources'));
            const metaFile = paths.join(root, 'resources', `${hash}.json`);

            // if exist, abort
            if (existsSync(metaFile)) {
                context.dispatch('finishTask', { id: handle });
                return undefined;
            }

            // use parser to parse metadata
            context.dispatch('updateTask', { id: handle, progress: 2, total: 4, message: 'resource.import.parsing' });

            const resource = await parseResource(path, hash, ext, data, source);

            console.log(`Import resource ${name}${ext}(${hash}) into ${resource.domain}`);

            let dataFile = paths.join(root, resource.domain, `${resource.name}${ext}`);

            if (existsSync(dataFile)) {
                dataFile = paths.join(root, resource.domain, `${resource.name}.${hash}${ext}`);
            }

            resource.path = dataFile;

            context.dispatch('updateTask', { id: handle, progress: 3, total: 4, message: 'resource.import.storing' });
            // write resource to disk
            if (isDir) {
                await ensureDir(dataFile);
                await copy(path, dataFile);
            } else {
                await ensureFile(dataFile);
                await fs.writeFile(dataFile, data);
            }

            context.dispatch('updateTask', { id: handle, progress: 4, total: 4, message: 'resource.import.update' });
            // store metadata to disk
            await fs.writeFile(paths.join(root, 'resources', `${hash}.json`), JSON.stringify(resource, undefined, 4));
            context.dispatch('finishTask', { id: handle });

            context.commit('resource', resource);

            return resource;
        },

        async deployResources(context, payload) {
            if (!payload) throw new Error('Require input a resource with minecraft location');

            const { resources, minecraft } = payload;
            if (!resources) throw new Error('Resources cannot be undefined!');
            if (!minecraft) throw new Error('Minecract location cannot be undefined!');

            const promises = [];
            for (const resource of resources) {
                /**
                * @type {import('universal/store/modules/resource').Resource<any> | undefined}
                */
                let res;
                if (typeof resource === 'string') res = context.getters.getResource(resource);
                else res = resource;

                if (!res) throw new Error(`Cannot find the resource ${resource}`);
                if (typeof res !== 'object' || !res.hash || !res.type || !res.domain || !res.name) {
                    throw new Error('The input resource object should be valid!');
                }
                const dest = paths.join(minecraft, res.domain, res.name + res.ext);
                if (existsSync(dest)) {
                    await fs.unlink(dest);
                }
                promises.push(fs.link(res.path, dest));
            }
            await Promise.all(promises);
        },

        async exportResource(context, payload) {
            const { resources, targetDirectory } = payload;

            const promises = [];
            for (const resource of resources) {
                /**
                * @type {import('universal/store/modules/resource').Resource<any>|undefined}
                */
                let res;
                if (typeof resource === 'string') res = context.getters.getResource(resource);
                else res = resource;

                if (!res) throw new Error(`Cannot find the resource ${resource}`);

                promises.push(copy(res.path, paths.join(targetDirectory, res.name + res.ext)));
            }
            await Promise.all(promises);
        },

    },
};

export default mod;
