import uuid from 'uuid';
import { Version, GameSetting, WorldInfo } from 'ts-minecraft';
import paths from 'path';
import { ZipFile } from 'yazl';
import { promises as fs, createWriteStream, existsSync, createReadStream, mkdtemp } from 'fs';
import { createExtractStream } from 'yauzlw';
import { tmpdir } from 'os';
import { fitin } from '../helpers/utils';
import base from './profile.base';
import { remove, copy, ensureDir } from '../helpers/fs-utils';

function createTemplate(id, java, mcversion, author) {
    return {
        id,

        name: 'Default',

        resolution: { width: 800, height: 400, fullscreen: false },
        java,
        minMemory: 1024,
        maxMemory: 2048,
        vmOptions: [],
        mcOptions: [],

        version: {
            minecraft: '',
            folder: '',
            id: '',
            forge: '',
        },
        forceVersion: false,

        mcversion,

        type: 'modpack',

        /**
         * Server section
         */
        servers: [],
        primary: -1,

        host: '',
        port: 25565,
        isLanServer: false,
        icon: '',

        status: {},

        /**
         * Modpack section
         */

        author,
        description: '',
        url: '',

        showLog: false,
        hideLauncher: true,

        maps: [],

        forge: {
            enabled: false,
            mods: [],
            version: '',
        },
        liteloader: {
            enabled: false,
            mods: [],
            version: '',
            settings: {},
        },
        optifine: {
            enabled: false,
            settings: {},
        },

        settings: {},

        diagnosis: {},
        errors: [],
    };
}

/**
 * @type {import('./profile').ProfileModule}
 */
const mod = {
    ...base,
    actions: {
        async loadProfile({ state, commit, dispatch, rootGetters, rootState }, id) {
            if (!existsSync(rootGetters.path('profiles', id, 'profile.json'))) {
                await remove(rootGetters.path('profiles', id));
                return;
            }

            const option = await dispatch('getPersistence', { path: `profiles/${id}/profile.json` }, { root: true });
            const profile = createTemplate(
                id,
                { ...rootGetters['java/default'] },
                rootGetters['version/minecraft/release'].id,
                rootState.user.name,
            );

            if (option.java && typeof profile.java.path === 'string') {
                const resolved = await dispatch('java/resolve', profile.java.path, { root: true });
                if (!resolved) {
                    option.java = undefined;
                }
            }

            fitin(profile, option);

            const opPath = rootGetters.path('profiles', id, 'options.txt');
            try {
                const optionString = await fs.readFile(opPath, 'utf-8');
                profile.settings = GameSetting.parseFrame(optionString);
            } catch (e) {
                console.warn(`An error ocurrs during parse game options of ${id}.`);
                console.warn(e);
                profile.settings = GameSetting.getDefaultFrame();
                await fs.writeFile(opPath, GameSetting.stringify(profile.settings));
            }

            const saveRoot = rootGetters.path('profiles', id, 'saves');
            try {
                const saves = await fs.readdir(saveRoot).then(a => a.filter(s => !s.startsWith('.')));
                const savesData = (await Promise.all(saves.map(s => paths.resolve(saveRoot, s))
                    .map(save => WorldInfo.read(save).catch(_ => undefined)))).filter(s => s !== undefined);
                profile.maps = savesData;
            } catch (e) {
                console.warn(`An error ocurred during parsing the save of ${id}`);
                console.warn(e);
            }

            commit('create', profile);
        },
        async load({ state, commit, dispatch, rootGetters, rootState }) {
            const dirs = await dispatch('readFolder', 'profiles', { root: true });

            if (dirs.length === 0) {
                await dispatch('createAndSelect', {});
                await dispatch('save', { mutation: 'select' });
                await dispatch('save', { mutation: 'create' });
                return;
            }

            const uuidExp = /([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}){1}/;
            await Promise.all(dirs.filter(f => uuidExp.test(f)).map(id => dispatch('loadProfile', id)));

            if (state.all.length === 0) {
                await dispatch('createAndSelect', {});
                await dispatch('save', { mutation: 'select' });
                await dispatch('save', { mutation: 'create' });
                return;
            }

            const persis = await dispatch('getPersistence', { path: 'profiles.json' }, { root: true });
            if (persis && persis.selected) {
                commit('select', persis.selected);
            } else {
                commit('select', state[Object.keys(state)[0]].id);
            }
        },

        save(context, { mutation, object }) {
            switch (mutation) {
                case 'profile/select':
                    return context.dispatch('setPersistence', {
                        path: 'profiles.json',
                        data: { selected: object },
                    }, { root: true });
                case 'profile/remove':
                case 'profile/maps':
                    return Promise.resolve();
                case 'profile/gamesettings':
                    return fs.writeFile(context.rootGetters.path('profiles', context.state.id, 'options.txt'),
                        GameSetting.stringify(context.getters.current.settings));
                case 'profile/create':
                case 'profile/edit':
                case 'profile/diagnose':
                default:
            }

            const current = context.getters.current;
            const persistent = {};
            const mask = { status: true, settings: true, optifine: true };
            Object.keys(current).filter(k => mask[k] === undefined)
                .forEach((k) => { persistent[k] = current[k]; });

            return context.dispatch('setPersistence', {
                path: `profiles/${context.state.id}/profile.json`,
                data: persistent,
            }, { root: true });
        },

        async create(context, payload) {
            const profile = createTemplate(
                uuid(),
                context.rootGetters['java/default'],
                context.rootGetters['version/minecraft/release'].id,
                context.rootState.user.name,
            );

            fitin(profile, payload);

            console.log('Create profile with option');
            console.log(profile);

            context.commit('create', profile);

            return profile.id;
        },

        async createAndSelect(context, payload) {
            const id = await context.dispatch('create', payload);
            await context.commit('select', id);
        },


        async delete(context, id = context.state.id) {
            if (context.state.id === id) {
                const allIds = Object.keys(context.state.all);
                if (allIds.length - 1 === 0) {
                    await context.dispatch('createAndSelect', {});
                } else {
                    context.commit('select', allIds[0]);
                }
            }
            context.commit('remove', id);
            await remove(context.rootGetters.path('profiles', id));
        },


        async export(context, { id = context.state.id, dest, noAssets = false }) {
            const root = context.rootState.root;
            const from = paths.join(root, 'profiles', id);
            const file = new ZipFile();
            const promise = new Promise((resolve, reject) => {
                file.outputStream.pipe(createWriteStream(dest)).on('close', () => { resolve(); })
                    .on('error', (e) => {
                        reject(e);
                    });
            });
            await walk(from, from);

            const { resourcepacks, mods } = await context.dispatch('resolveResources', id);
            const defaultMcversion = context.state.all[id].mcversion;

            const carriedVersionPaths = [];

            const versionInst = await Version.parse(root, defaultMcversion);
            carriedVersionPaths.push(...versionInst.pathChain);

            if (!noAssets) {
                const assetsJson = paths.resolve(root, 'assets', 'indexes', `${versionInst.assets}.json`);
                file.addFile(assetsJson, `assets/indexes/${versionInst.assets}.json`);
                const objects = await fs.readFile(assetsJson, { encoding: 'utf-8' }).then(JSON.parse).then(manifest => manifest.objects);
                for (const hash of Object.keys(objects).map(k => objects[k].hash)) {
                    file.addFile(paths.resolve(root, 'assets', 'objects', hash.substring(0, 2), hash), `assets/objects/${hash.substring(0, 2)}/${hash}`);
                }
            }


            for (const verPath of carriedVersionPaths) {
                const versionId = paths.basename(verPath);
                const versionFiles = await fs.readdir(verPath);
                for (const versionFile of versionFiles) {
                    if (!await fs.stat(paths.join(verPath, versionFile)).then(s => s.isDirectory())) {
                        file.addFile(paths.join(verPath, versionFile), `versions/${versionId}/${versionFile}`);
                    }
                }
            }

            for (const lib of versionInst.libraries) {
                file.addFile(paths.resolve(root, 'libraries', lib.download.path),
                    `libraries/${lib.download.path}`);
            }

            for (const resourcepack of resourcepacks) {
                const filename = resourcepack.name + resourcepack.ext;
                file.addFile(paths.join(root, 'resourcepacks', filename),
                    `resourcepacks/${filename}`);
            }

            for (const mod of mods) {
                const filename = mod.name + mod.ext;
                file.addFile(paths.join(root, 'mods', filename),
                    `mods/${filename}`);
            }

            file.end();
            return promise;

            async function walk(root, real) {
                const relative = paths.relative(root, real);
                const stat = await fs.stat(real);
                if (stat.isDirectory()) {
                    const files = await fs.readdir(real);
                    if (relative !== '') {
                        file.addEmptyDirectory(relative);
                    }
                    await Promise.all(files.map(f => walk(root, paths.join(real, f))));
                } else if (stat.isFile()) {
                    file.addFile(real, relative);
                }
            }
        },

        async import(context, location) {
            const stat = await fs.stat(location);
            const isDir = stat.isDirectory();
            let srcFolderPath = location;
            if (!isDir) {
                const tempDir = await mkdtemp(paths.join(tmpdir(), 'launcher'));
                await createReadStream(location)
                    .pipe(createExtractStream(tempDir))
                    .promise();
                srcFolderPath = tempDir;
            }
            const proiflePath = paths.resolve(srcFolderPath, 'profile.json');

            const id = uuid.v4();
            const destFolderPath = context.rootGetters.path('profiles', id);

            await ensureDir(destFolderPath);
            await copy(srcFolderPath, destFolderPath, (path) => {
                if (path.endsWith('/versions')) return false;
                if (path.endsWith('/assets')) return false;
                if (path.endsWith('/libraries')) return false;
                if (path.endsWith('/resourcepacks')) return false;
                if (path.endsWith('/mods')) return false;
                return true;
            });

            const modsDir = paths.resolve(srcFolderPath, 'mods');
            const forgeMods = [];
            const litesMods = [];
            if (existsSync(modsDir)) {
                for (const file of await fs.readdir(modsDir)) {
                    try {
                        const resource = await context.dispatch('resource/import', { path: paths.resolve(srcFolderPath, 'mods', file) }, { root: true });
                        if (resource) {
                            if (resource.type === 'forge') {
                                /**
                                 * @type {import('ts-minecraft').Forge.MetaData}
                                 */
                                const meta = resource.metadata[0];
                                forgeMods.push(`${meta.modid}:${meta.version}`);
                            } else if (resource.type === 'liteloader') {
                                /**
                                 * @type {import('ts-minecraft').LiteLoader.MetaData}
                                 */
                                const meta = resource.metadata;
                                litesMods.push(`${meta.name}:${meta.version}`);
                            }
                        }
                    } catch (e) {
                        console.error(`Cannot import mod at ${file}.`);
                    }
                }
            }

            const resourcepacksDir = paths.resolve(srcFolderPath, 'resourcepacks');
            if (existsSync(resourcepacksDir)) {
                for (const file of await fs.readdir(resourcepacksDir)) {
                    await context.dispatch('resource/import', { path: paths.resolve(srcFolderPath, 'resourcepacks', file) });
                }
            }

            await copy(paths.resolve(srcFolderPath, 'assets'), paths.resolve(context.state.root, 'assets'));
            await copy(paths.resolve(srcFolderPath, 'libraries'), paths.resolve(context.state.root, 'libraries'));

            await copy(paths.resolve(srcFolderPath, 'versions'), paths.resolve(context.state.root, 'versions')); // TODO: check this

            let profileTemplate = {};
            const isExportFromUs = await fs.stat(proiflePath).then(s => s.isFile()).catch(_ => false);
            if (isExportFromUs) {
                profileTemplate = await fs.readFile(proiflePath).then(buf => buf.toString()).then(JSON.parse, () => ({}));
                delete profileTemplate.java;

                if (!profileTemplate.forge) {
                    profileTemplate.forge = {
                        mods: forgeMods,
                    };
                }
                if (!profileTemplate.forge.mods) profileTemplate.forge.mods = forgeMods;
                if (!profileTemplate.liteloader) {
                    profileTemplate.liteloader = {
                        mods: litesMods,
                    };
                }
                if (!profileTemplate.liteloader.mods) profileTemplate.liteloader.mods = litesMods;
            }

            await fs.writeFile(context.rootGetters.path('profiles', id, 'profile.json'), JSON.stringify(profileTemplate, null, 4));

            await context.dispatch('loadProfile', id);

            if (!isDir) {
                await remove(srcFolderPath);
            }
        },

        resolveResources(context, id = context.state.id) {
            const profile = context.state.all[id];

            const modResources = [];
            const resourcePackResources = [];
            if (profile.forge.enabled || profile.liteloader.enabled
                || (profile.forge.mods && profile.forge.mods.length !== 0)
                || (profile.liteloader.mods && profile.liteloader.mods.length !== 0)) {
                const forgeMods = profile.forge.mods;
                const liteloaderMods = profile.liteloader.mods;

                const mods = context.rootState.resource.mods;

                const forgeModIdVersions = {};
                const liteNameVersions = {};

                Object.keys(mods).forEach((hash) => {
                    const mod = mods[hash];
                    if (mod.type === 'forge') {
                        forgeModIdVersions[`${mod.metadata.modid}:${mod.metadata.version}`] = mod;
                    } else {
                        liteNameVersions[`${mod.metadata.name}:${mod.metadata.version}`] = mod;
                    }
                });
                modResources.push(...forgeMods.map(key => forgeModIdVersions[key]).filter(r => r !== undefined));
                modResources.push(...liteloaderMods.map(key => liteNameVersions[key]).filter(r => r !== undefined));
            }
            if (profile.settings.resourcePacks) {
                const requiredResourcepacks = profile.settings.resourcePacks;

                const nameToId = {};
                const allPacks = context.rootState.resource.resourcepacks;
                Object.keys(allPacks).forEach((hash) => {
                    const pack = allPacks[hash];
                    nameToId[pack.name + pack.ext] = pack;
                });
                const requiredResources = requiredResourcepacks.map(packName => nameToId[packName]).filter(r => r !== undefined);
                resourcePackResources.push(...requiredResources);
            }

            return { mods: modResources, resourcepacks: resourcePackResources };
        },

        async diagnose(context) {
            const id = context.state.id;
            const { mcversion, java } = context.state.all[id];
            const errors = [];
            let diagnosis;
            if (!mcversion) {
                errors.push({ id: 'missingVersion' });
            } else {
                const location = context.rootState.root;
                const versionDiagnosis = await Version.diagnose(mcversion, location);

                for (const key of ['missingVersionJar', 'missingAssetsIndex']) {
                    if (versionDiagnosis[key]) {
                        errors.push({
                            id: key,
                            arguments: { version: mcversion },
                            autofix: true,
                        });
                    }
                }
                if (versionDiagnosis.missingVersionJson !== '') {
                    errors.push({
                        id: 'missingVersionJson',
                        arguments: { version: versionDiagnosis.missingVersionJson },
                        autofix: true,
                    });
                }
                if (versionDiagnosis.missingLibraries.length !== 0) {
                    errors.push({
                        id: 'missingLibraries',
                        arguments: { count: versionDiagnosis.missingLibraries.length },
                        autofix: true,
                    });
                }
                const missingAssets = Object.keys(versionDiagnosis.missingAssets);
                if (missingAssets.length !== 0) {
                    errors.push({
                        id: 'missingAssets',
                        arguments: { count: missingAssets.length },
                        autofix: true,
                    });
                }
                diagnosis = versionDiagnosis;
            }

            if (!java || !java.path || !java.majorVersion || !java.version) {
                errors.push({
                    id: 'missingJava',
                    options: [{
                        id: 'autoDownload',
                    }, {
                        id: 'manualDownload',
                    }, {
                        id: 'selectJava',
                    }],
                });
            }
            context.commit('diagnose', { diagnosis, errors });
        },
    },
};

export default mod;
