import { createReadStream, existsSync, promises as fs } from 'fs';
import { copy, ensureDir, ensureFile, remove } from 'main/utils/fs';
import { compressZipTo, includeAllToZip } from 'main/utils/zip';
import { ArtifactVersion, VersionRange } from 'maven-artifact-version';
import { tmpdir } from 'os';
import paths, { basename, join } from 'path';
import { latestMcRelease } from 'static/dummy.json';
import protocolToVersion from 'static/protocol.json';
import { Forge, ForgeWebPage, GameSetting, Server, TextComponent, Version, World } from 'ts-minecraft';
import base, { createTemplate } from 'universal/store/modules/profile';
import { willBaselineChange, fitin } from 'universal/utils/object';
import packFormatMapping from 'universal/utils/packFormatMapping.json';
import uuid from 'uuid';
import { createExtractStream } from 'yauzlw';
import { ZipFile } from 'yazl';

const PINGING_STATUS = Object.freeze({
    version: {
        name: 'Unknown',
        protocol: -1,
    },
    players: {
        max: -1,
        online: -1,
    },
    description: 'Ping...',
    favicon: '',
    ping: 0,
});
/**
 * 
 * @param {string} description 
 */
function createFailureServerStatus(description) {
    return Object.freeze({
        version: {
            name: 'Unknown',
            protocol: -1,
        },
        players: {
            max: -1,
            online: -1,
        },
        description,
        favicon: '',
        ping: -1,
    });
}

/**
 * @type {import('universal/store/modules/profile').ProfileModule}
 */
const mod = {
    ...base,
    actions: {
        async loadProfile({ commit, dispatch, rootGetters, rootState }, id) {
            if (!existsSync(rootGetters.path('profiles', id, 'profile.json'))) {
                await remove(rootGetters.path('profiles', id));
                return;
            }

            const option = await dispatch('getPersistence', { path: `profiles/${id}/profile.json` });
            const type = option.type || 'modpack';
            const profile = createTemplate(
                id,
                { path: '', version: '', majorVersion: 8 },
                latestMcRelease,
                type,
            );

            if (profile.type === 'modpack') {
                profile.author = profile.author || rootState.user.name;
            }

            if (option && option.java && typeof profile.java.path === 'string') {
                const resolved = await dispatch('resolveJava', profile.java.path);
                if (!resolved) {
                    option.java = undefined;
                }
            }

            delete option.serverInfos;
            delete option.worlds;
            delete option.settings;
            delete option.refreshing;
            delete option.problems;

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

            try {
                const saveRoot = rootGetters.path('profiles', id, 'saves');
                if (existsSync(saveRoot)) {
                    const saves = await fs.readdir(saveRoot).then(a => a.filter(s => !s.startsWith('.')));
                    const savesData = (await Promise.all(saves.map(s => paths.resolve(saveRoot, s))
                        .map(save => World.load(save, ['level']).catch(_ => undefined))))
                        .filter(s => s !== undefined);
                    // @ts-ignore
                    profile.worlds = savesData;
                }
            } catch (e) {
                console.warn(`An error ocurred during parsing the save of ${id}`);
                console.warn(e);
            }


            try {
                const serverPath = rootGetters.path('profiles', id, 'servers.dat');
                if (existsSync(serverPath)) {
                    const serverDat = await fs.readFile(serverPath);
                    const infos = Server.readInfo(serverDat);
                    profile.serverInfos = infos;
                }
            } catch (e) {
                console.warn(`An error occured during loading server infos of ${id}`);
                console.error(e);
            }

            commit('addProfile', profile);
        },

        async init({ state, commit, dispatch, rootGetters, rootState }) {
            const profiles = rootGetters.profiles;
            if (profiles.length === 0) {
                await dispatch('createAndSelectProfile', { type: 'modpack' });
            } else if (!rootGetters.missingJava) {
                for (const profile of profiles) {
                    if (profile.java.path === '') {
                        commit('profile', {
                            java: rootGetters.defaultJava,
                        });
                    }
                }
            }
            dispatch('diagnoseProfile');
        },
        async load({ state, commit, dispatch }) {
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
                case 'profile':
                    await context.dispatch('setPersistence', {
                        path: `profiles/${context.state.id}/profile.json`,
                        data: {
                            ...current,
                            serverInfos: undefined,
                            settings: undefined,
                            worlds: undefined,
                            problems: undefined,
                            refreshing: undefined,
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
                payload.type || 'modpack',
            );

            if (profile.type === 'modpack') {
                profile.author = context.rootState.user.name;
            }

            fitin(profile, payload);

            await ensureDir(context.rootGetters.path('profiles', profile.id));

            context.commit('addProfile', profile);

            console.log('Created profile with option');
            console.log(profile);

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
                    await context.dispatch('createAndSelectProfile', { type: 'modpack' });
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
            const promise = compressZipTo(file, dest);
            await includeAllToZip(from, from, file);

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
        },

        async importProfile(context, location) {
            const stat = await fs.stat(location);
            const isDir = stat.isDirectory();
            let srcFolderPath = location;
            if (!isDir) {
                const tempDir = await fs.mkdtemp(paths.join(tmpdir(), 'launcher'));
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
            if ((profile.forge.mods && profile.forge.mods.length !== 0)
                || (profile.liteloader.mods && profile.liteloader.mods.length !== 0)) {
                const forgeMods = profile.forge.mods;
                const liteloaderMods = profile.liteloader.mods;

                const mods = context.rootState.resource.mods;

                /**
                 * @type {{[key: string]: import('universal/store/modules/resource').ResourceModule.ForgeResource}}
                 */
                const forgeModIdVersions = {};
                /**
                * @type {{[key: string]: import('universal/store/modules/resource').ResourceModule.LiteloaderResource}}
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
                 * @type {{[name:string]:import('universal/store/modules/resource').ResourceModule.ResourcePackResource}}
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

        async editProfile(context, profile) {
            const current = context.state.all[context.state.id];
            if (willBaselineChange(profile, current)) {
                context.commit('profile', profile);
                await context.dispatch('diagnoseProfile');
            }
        },

        async fixProfile(context, problems) {
            const autofixed = problems.filter(p => p.autofix);

            if (autofixed.length === 0) return;

            context.commit('refreshingProfile', true);

            const profile = context.rootGetters.selectedProfile;
            const { id, mcversion, forge, liteloader } = profile;
            const currentVersion = context.getters.currentVersion;


            if (mcversion === '') return;

            try {
                if (autofixed.some(p => p.id === 'missingVersionJar')) {
                    const versionMeta = context.rootState.version.minecraft.versions.find(v => v.id === mcversion);
                    const handle = await context.dispatch('installMinecraft', versionMeta);
                    await context.dispatch('waitTask', handle);
                }

                if (autofixed.some(p => p.id === 'missingVersionJson')) {
                    const mcvermeta = context.rootState.version.minecraft.versions.find(v => v.id === mcversion);
                    if (!mcvermeta) {
                        throw { error: 'missingVersionMeta', version: mcvermeta };
                    }
                    const mcInstallHandle = await context.dispatch('installMinecraft', mcvermeta);
                    await context.dispatch('waitTask', mcInstallHandle);
                    if (forge.version) {
                        const forgeVersion = context.rootState.version.forge[mcversion];
                        if (!forgeVersion) {
                            throw new Error('unexpected');
                        }
                        const found = forgeVersion.versions.find(v => v.version === forge.version);
                        if (found) {
                            const forge = ForgeWebPage.Version.to(found);
                            const handle = await context.dispatch('installForge', forge);
                            const fullVersion = await context.dispatch('waitTask', handle);
                            const depHandle = await context.dispatch('installDependencies', fullVersion);
                            await context.dispatch('waitTask', depHandle);
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
                        const forgeMeta = ForgeWebPage.Version.to(forgeVer);
                        const handle = await context.dispatch('installForge', forgeMeta);
                        await context.dispatch('waitTask', handle);
                    }
                }

                if (autofixed.some(p => ['missingAssetsIndex', 'missingAssets'].indexOf(p.id) !== -1)) {
                    try {
                        const targetVersion = await context.dispatch('resolveVersion', currentVersion);
                        const handle = await context.dispatch('installAssets', targetVersion);
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
                await context.dispatch('diagnoseProfile');
            } catch (e) {
                console.error(e);
            } finally {
                context.commit('refreshingProfile', false);
            }
        },

        async diagnoseProfile(context) {
            context.commit('refreshingProfile', true);
            const id = context.state.id;
            const { mcversion, forge, liteloader } = context.state.all[id];
            const currentVersion = context.getters.currentVersion;
            const targetVersion = await context.dispatch('resolveVersion', currentVersion)
                .catch(() => currentVersion.id);

            console.log(`Diagnose for ${targetVersion}`);

            /**
             * @type {import('universal/store/modules/profile').ProfileModule.Problem[]}
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

            let java = context.state.all[id].java;

            if (!java || !java.path || !java.majorVersion || !java.version) {
                context.commit('profile', {
                    java: context.rootGetters.defaultJava,
                });
            }

            java = context.state.all[id].java;
            if (java.majorVersion > 8) {
                if (!resolvedMcVersion.minorVersion || resolvedMcVersion.minorVersion < 13) {
                    problems.push({
                        id: 'incompatibleJava',
                        arguments: { java: java.version, mcversion },
                        optional: true,
                    });
                }
            }

            context.commit('profileProblems', problems);

            context.commit('refreshingProfile', false);
            return problems;
        },
        async pingServers(context) {
            const version = context.getters.serverProtocolVersion;
            const prof = context.getters.selectedProfile;
            if (prof.serverInfos.length > 0) {
                const results = await Promise.all(prof.serverInfos.map(s => Server.fetchStatusFrame(s, { protocol: version })));
                return results.map((r, i) => ({ status: r, ...prof.serverInfos[i] }));
            }
            return [];
        },
        async refreshProfile(context) {
            const prof = context.getters.selectedProfile;
            if (prof.type === 'server') {
                context.commit('serverStatus', PINGING_STATUS);
                const { host, port } = prof;
                try {
                    const status = await Server.fetchStatusFrame({
                        host, port,
                    });
                    context.commit('serverStatus', status);
                } catch (e) {
                    switch (e.code) {
                        case 'ETIMEOUT':
                            context.commit('serverStatus', createFailureServerStatus('server.status.timeout'));
                            break;
                        case 'ENOTFOUND':
                            context.commit('serverStatus', createFailureServerStatus('server.status.nohost'));
                            break;
                        case 'ECONNREFUSED':
                            context.commit('serverStatus', createFailureServerStatus('server.status.refuse'));
                            break;
                        default:
                            context.commit('serverStatus', createFailureServerStatus('server.status.ping'));
                            break;
                    }
                }
            }
        },
        async createProfileFromServer(context, info) {
            const options = {};
            options.name = info.name;
            if (info.status) {
                if (typeof info.status.description === 'string') {
                    options.description = info.status.description;
                } else if (typeof info.status.description === 'object') {
                    options.description = TextComponent.from(info.status.description).formatted;
                }
                options.mcversion = protocolToVersion[info.status.version.protocol][0];
                if (info.status.modinfo && info.status.modinfo.type === 'FML') {
                    options.forge = {
                        mods: info.status.modinfo.modList.map(m => `${m.modid}:${m.version}`),
                    };
                }
            }
            return context.dispatch('createProfile', {
                type: 'server',
                ...options,
                host: info.host,
                port: info.port || 25565,
            });
        },
        async importMap(context, filePath) {
            const cur = context.getters.selectedProfile;
            const world = await World.load(filePath, ['level']);
            const dest = context.rootGetters.path('profiles', cur.id, 'saves', basename(filePath));
            await ensureFile(dest);
            await copy(filePath, dest);
            context.commit('worlds', [...cur.worlds, world]);
        },
        async deleteMap(context, name) {
            const cur = context.getters.selectedProfile;
            const result = cur.worlds.find(l => l.level.LevelName === name);
            if (result) {
                await remove(result.path);
            }
        },
        async exportMap(context, payload) {
            const { name, zip, destination } = payload;
            const cur = context.getters.selectedProfile;
            const result = cur.worlds.find(l => l.level.LevelName === name);

            /**
             * @param {string} src 
             * @param {string} dest 
             */
            async function transferFile(src, dest) {
                if (!zip) {
                    return copy(src, dest);
                }
                const zipFile = new ZipFile();
                const promise = compressZipTo(zipFile, dest);
                await includeAllToZip(src, src, zipFile);
                zipFile.end();
                return promise;
            }

            if (result) {
                try {
                    const stat = await fs.stat(destination);
                    const dest = stat.isDirectory() ? join(destination, basename(result.path)) : destination;
                    await ensureFile(destination);
                    await transferFile(result.path, dest);
                } catch (e) {
                    await ensureFile(destination);
                    await transferFile(result.path, destination);
                }
            }
        },
    },
};

export default mod;
