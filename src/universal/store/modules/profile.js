import uuid from 'uuid';
import { Version, GameSetting, World, Forge, ForgeWebPage } from 'ts-minecraft';
import paths from 'path';
import { ZipFile } from 'yazl';
import { promises as fs, createWriteStream, existsSync, createReadStream, promises } from 'fs';
import packFormatMapping from 'universal/utils/packFormatMapping.json';
import { createExtractStream } from 'yauzlw';
import { tmpdir } from 'os';
import { VersionRange, ArtifactVersion } from 'maven-artifact-version';
import { latestMcRelease } from 'static/dummy.json';
import { remove, copy, ensureDir } from 'universal/utils/fs';
import { fitin } from 'universal/utils/object';
import base, { createTemplate } from './profile.base';

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

            const option = await dispatch('getPersistence', { path: `profiles/${id}/profile.json` });
            const latestRelease = rootGetters.minecraftRelease || { id: latestMcRelease };
            const profile = createTemplate(
                id,
                { ...rootGetters.defaultJava },
                latestRelease.id,
                rootState.user.name,
            );

            if (option && option.java && typeof profile.java.path === 'string') {
                const resolved = await dispatch('resolveJava', profile.java.path);
                if (!resolved) {
                    option.java = undefined;
                }
            }

            fitin(profile, option);

            const opPath = rootGetters.path('profiles', id, 'options.txt');
            try {
                const option = await fs.readFile(opPath, 'utf-8').then(b => b.toString()).then(GameSetting.parseFrame);
                if (option) {
                    profile.settings = option;
                }
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
                    .map(save => World.load(save, ['level']).catch(_ => undefined))))
                    .filter(s => s !== undefined);
                profile.maps = savesData;
            } catch (e) {
                console.warn(`An error ocurred during parsing the save of ${id}`);
                console.warn(e);
            }

            commit('addProfile', profile);
        },

        async init({ state, commit, dispatch, rootGetters, rootState }) {
            if (Object.keys(state.all).length === 0) {
                await dispatch('createAndSelectProfile', {});
            }
        },
        async load({ state, commit, dispatch, rootGetters, rootState }) {
            const dirs = await dispatch('readFolder', 'profiles');

            if (dirs.length === 0) {
                return;
            }

            const uuidExp = /([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}){1}/;
            await Promise.all(dirs.filter(f => uuidExp.test(f)).map(id => dispatch('loadProfile', id)));

            if (Object.keys(state.all).length === 0) {
                return;
            }

            const persis = await dispatch('getPersistence', { path: 'profiles.json' });
            if (persis && persis.selected) {
                commit('selectProfile', persis.selected);
            } else {
                commit('selectProfile', Object.keys(state.all)[0]);
            }
        },

        async save(context, { mutation, payload }) {
            const current = context.getters.selectedProfile;
            switch (mutation) {
                case 'selectProfile':
                    await context.dispatch('setPersistence', {
                        path: 'profiles.json',
                        data: { selected: payload },
                    });
                    break;
                case 'gamesettings':
                    await fs.writeFile(context.rootGetters.path('profiles', context.state.id, 'options.txt'),
                        GameSetting.stringify(context.getters.selectedProfile.settings));
                    break;
                case 'addProfile':
                case 'removeProfile':
                case 'editProfile':
                    await context.dispatch('setPersistence', {
                        path: `profiles/${context.state.id}/profile.json`,
                        data: {
                            ...current,
                            server: {
                                ...current.server,
                                status: undefined,
                            },
                            settings: undefined,
                            optifine: undefined,
                            maps: undefined,
                        },
                    });
                    break;
                default:
            }
        },

        async createProfile(context, payload) {
            const latestRelease = context.rootGetters.minecraftRelease || { id: latestMcRelease };
            const profile = createTemplate(
                uuid(),
                context.rootGetters.defaultJava,
                latestRelease.id,
                context.rootState.user.name,
            );

            fitin(profile, payload);

            await ensureDir(context.rootGetters.path('profiles', profile.id));

            console.log('Create profile with option');
            console.log(profile);

            context.commit('addProfile', profile);

            return profile.id;
        },

        async createAndSelectProfile(context, payload) {
            const id = await context.dispatch('createProfile', payload);
            await context.commit('selectProfile', id);
        },


        async deleteProfile(context, id = context.state.id) {
            if (context.state.id === id) {
                const allIds = Object.keys(context.state.all);
                if (allIds.length - 1 === 0) {
                    await context.dispatch('createAndSelectProfile', {});
                } else {
                    context.commit('selectProfile', allIds[0]);
                }
            }
            context.commit('removeProfile', id);
            await remove(context.rootGetters.path('profiles', id));
        },


        async exportProfile(context, { id = context.state.id, dest, noAssets = false }) {
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

            const { resourcepacks, mods } = await context.dispatch('resolveProfileResources', id);
            const defaultMcversion = context.state.all[id].mcversion;

            const carriedVersionPaths = [];

            const versionInst = await Version.parse(root, defaultMcversion);
            carriedVersionPaths.push(...versionInst.pathChain);

            if (!noAssets) {
                const assetsJson = paths.resolve(root, 'assets', 'indexes', `${versionInst.assets}.json`);
                file.addFile(assetsJson, `assets/indexes/${versionInst.assets}.json`);
                const objects = await fs.readFile(assetsJson, { encoding: 'utf-8' }).then(b => b.toString()).then(JSON.parse).then(manifest => manifest.objects);
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

            /**
             * @param {string} root
             * @param {string} real
             */
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

        async importProfile(context, location) {
            const stat = await fs.stat(location);
            const isDir = stat.isDirectory();
            let srcFolderPath = location;
            if (!isDir) {
                const tempDir = await promises.mkdtemp(paths.join(tmpdir(), 'launcher'));
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
                        const resource = await context.dispatch('importResource', { path: paths.resolve(srcFolderPath, 'mods', file) });
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
                    await context.dispatch('importResource', { path: paths.resolve(srcFolderPath, 'resourcepacks', file) });
                }
            }

            await copy(paths.resolve(srcFolderPath, 'assets'), paths.resolve(context.rootState.root, 'assets'));
            await copy(paths.resolve(srcFolderPath, 'libraries'), paths.resolve(context.rootState.root, 'libraries'));

            await copy(paths.resolve(srcFolderPath, 'versions'), paths.resolve(context.rootState.root, 'versions')); // TODO: check this

            let profileTemplate = {};
            const isExportFromUs = await fs.stat(proiflePath).then(s => s.isFile()).catch(_ => false);
            if (isExportFromUs) {
                profileTemplate = await fs.readFile(proiflePath).then(buf => buf.toString()).then(JSON.parse, () => ({}));
                Reflect.deleteProperty(profileTemplate, 'java');

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

        resolveProfileResources(context, id = context.state.id) {
            const profile = context.state.all[id];

            const modResources = [];
            const resourcePackResources = [];
            if (profile.forge.enabled || profile.liteloader.enabled
                || (profile.forge.mods && profile.forge.mods.length !== 0)
                || (profile.liteloader.mods && profile.liteloader.mods.length !== 0)) {
                const forgeMods = profile.forge.mods;
                const liteloaderMods = profile.liteloader.mods;

                const mods = context.rootState.resource.mods;

                /**
                 * @type {{[key: string]: import('./resource').ResourceModule.ForgeResource}}
                 */
                const forgeModIdVersions = {};
                /**
                * @type {{[key: string]: import('./resource').ResourceModule.LiteloaderResource}}
                */
                const liteNameVersions = {};

                Object.keys(mods).forEach((hash) => {
                    const mod = mods[hash];
                    if (mod.type === 'forge') {
                        forgeModIdVersions[`${mod.metadata[0].modid}:${mod.metadata[0].version}`] = mod;
                    } else {
                        liteNameVersions[`${mod.metadata.name}:${mod.metadata.version}`] = mod;
                    }
                });
                modResources.push(...forgeMods.map(key => forgeModIdVersions[key]).filter(r => r !== undefined));
                modResources.push(...liteloaderMods.map(key => liteNameVersions[key]).filter(r => r !== undefined));
            }
            if (profile.settings.resourcePacks) {
                const requiredResourcepacks = profile.settings.resourcePacks;

                /**
                 * @type {{[name:string]:import('./resource').ResourceModule.ResourcePackResource}}
                 */
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

        async fixProfile(context, problems) {
            const autofixed = problems.filter(p => p.autofix);

            if (autofixed.length === 0) return;

            const profile = context.rootGetters.selectedProfile;
            const { id, mcversion, forge, liteloader } = profile;
            const currentVersion = context.getters.currentVersion;


            if (mcversion === '') return;

            if (autofixed.some(p => p.id === 'missingVersionJar')) {
                const versionMeta = context.rootState.version.minecraft.versions.find(v => v.id === mcversion);
                const handle = await context.dispatch('installMinecraft', versionMeta);
                await context.dispatch('waitTask', handle);
            }

            if (autofixed.some(p => p.id === 'missingVersionJson')) {
                if (forge.enabled && forge.version) {
                    const forgeVersion = context.rootState.version.forge[mcversion];
                    if (!forgeVersion) {
                        throw new Error('unexpected');
                    }
                    const found = forgeVersion.versions.find(v => v.version === forge.version);
                    if (found) {
                        const forge = ForgeWebPage.Version.to(found);
                        const handle = await context.dispatch('installForge', forge);
                        await context.dispatch('waitTask', handle);
                    }
                }
                // TODO: support liteloader & fabric
            }

            const missingForgeJar = autofixed.find(p => p.id === 'missingForgeJar');
            if (missingForgeJar && missingForgeJar.arguments) {
                const { minecraft, forge } = missingForgeJar.arguments;
                const forgeVersion = context.rootState.version.forge[minecraft];
                if (!forgeVersion) {
                    throw new Error('unexpected'); // TODO: handle this case
                }
                const forgeVer = forgeVersion.versions.find(v => v.version === forge);
                if (!forgeVer) {
                    console.error('Unexpected missing forge context for missingForgeJar problem');
                } else {
                    const forgeMeta = ForgeWebPage.Version.to(forge);
                    const handle = await context.dispatch('installForge', forgeMeta);
                    await context.dispatch('waitTask', handle);
                }
            }

            if (autofixed.some(p => ['missingAssetsIndex', 'missingAssets'].indexOf(p.id) !== -1)) {
                try {
                    const targetVersion = await context.dispatch('resolveVersion', currentVersion);
                    const handle = await context.dispatch('installDependencies', targetVersion);
                    await context.dispatch('waitTask', handle);
                } catch {
                    console.error('Cannot fix assetes');
                }
            }
            const missingLibs = autofixed.find(p => p.id === 'missingLibraries');
            if (missingLibs && missingLibs.arguments && missingLibs.arguments.libraries) {
                const handle = await context.dispatch('installLibraries', { libraries: missingLibs.arguments.libraries });
                await context.dispatch('waitTask', handle);
            }
        },

        async diagnoseProfile(context) {
            const id = context.state.id;
            const { mcversion, java, forge, liteloader } = context.state.all[id];
            const currentVersion = context.getters.currentVersion;
            const targetVersion = await context.dispatch('resolveVersion', currentVersion)
                .catch(() => currentVersion.id);

            console.log(`Diagnose for ${targetVersion}`);

            /**
             * @type {import('./profile').ProfileModule.Problem[]}
             */
            const problems = [];
            if (!mcversion) {
                problems.push({ id: 'missingVersion' });
            } else {
                const location = context.rootState.root;
                const versionDiagnosis = await Version.diagnose(targetVersion, location);

                if (versionDiagnosis.missingVersionJar) {
                    problems.push({
                        id: 'missingVersionJar',
                        arguments: { version: mcversion },
                        autofix: true,
                    });
                }
                if (versionDiagnosis.missingAssetsIndex) {
                    problems.push({
                        id: 'missingAssetsIndex',
                        arguments: { version: mcversion },
                        autofix: true,
                    });
                }
                if (versionDiagnosis.missingVersionJson !== '') {
                    problems.push({
                        id: 'missingVersionJson',
                        arguments: { version: versionDiagnosis.missingVersionJson },
                        autofix: true,
                    });
                }
                if (versionDiagnosis.missingLibraries.length !== 0) {
                    const missingForge = versionDiagnosis.missingLibraries.find(l => l.name.startsWith('net.minecraftforge:forge'));
                    if (missingForge) {
                        const [minecraft, forge] = missingForge.name.substring('net.minecraftforge:forge:'.length).split('-');
                        problems.push({
                            id: 'missingForgeJar',
                            arguments: { minecraft, forge },
                            autofix: true,
                        });
                    }
                    problems.push({
                        id: 'missingLibraries',
                        arguments: {
                            count: versionDiagnosis.missingLibraries.length,
                            libraries: versionDiagnosis.missingLibraries.filter(l => !l.name.startsWith('net.minecraftforge:forge')),
                        },
                        autofix: true,
                    });
                }
                const missingAssets = Object.keys(versionDiagnosis.missingAssets);
                if (missingAssets.length !== 0) {
                    problems.push({
                        id: 'missingAssets',
                        arguments: { count: missingAssets.length },
                        autofix: true,
                    });
                }
            }

            const { resourcepacks, mods } = await context.dispatch('resolveProfileResources', id);
            const resolvedMcVersion = ArtifactVersion.of(mcversion);

            for (const mod of mods) {
                if (mod.type === 'forge') {
                    /**
                     * @type {Forge.MetaData[]}
                     */
                    const metadatas = mod.metadata;
                    for (const meta of metadatas) {
                        const acceptVersion = meta.acceptedMinecraftVersions ? meta.acceptedMinecraftVersions : `[${meta.mcversion}]`;
                        if (!acceptVersion) {
                            problems.push({
                                id: 'unknownMod',
                                arguments: { name: mod.name, actual: mcversion },
                                optional: true,
                            });
                            break;
                        } else {
                            const range = VersionRange.createFromVersionSpec(acceptVersion);
                            if (range && !range.containsVersion(resolvedMcVersion)) {
                                problems.push({
                                    id: 'incompatibleMod',
                                    arguments: { name: mod.name, accepted: acceptVersion, actual: mcversion },
                                    optional: true,
                                });
                                break;
                            }
                        }
                    }
                }
            }

            for (const pack of resourcepacks) {
                if (pack.metadata.format in packFormatMapping) {
                    // @ts-ignore
                    const acceptVersion = packFormatMapping[pack.metadata.format];
                    const range = VersionRange.createFromVersionSpec(acceptVersion);
                    if (range && !range.containsVersion(resolvedMcVersion)) {
                        problems.push({
                            id: 'incompatibleResourcePack',
                            arguments: { name: pack.name, accepted: acceptVersion, actual: mcversion },
                            optional: true,
                        });
                    }
                }
            }

            if (!java || !java.path || !java.majorVersion || !java.version) {
                context.commit('editProfile', {
                    java: context.rootGetters.defaultJava,
                });
            }
            return problems;
        },
    },
};

export default mod;
