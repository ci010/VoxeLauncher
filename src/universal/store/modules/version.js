import {
    Forge, Version, ForgeWebPage, LiteLoader, MinecraftFolder,
} from 'ts-minecraft';
import { installLibraries } from 'ts-minecraft/dest/libs/download';

import { promises as fs, createReadStream } from 'fs';

import { createHash } from 'crypto';
import { getExpectVersion } from 'universal/utils/versions';
import { ensureFile } from 'universal/utils/fs';
import { requireString } from 'universal/utils/object';
import Task from 'treelike-task';
import base from './version.base';

/**
 * @type {import('./version').VersionModule}
 */
const mod = {
    namespaced: true,
    state: base.state,
    getters: base.getters,
    mutations: base.mutations,
    actions: {
        load(context) {
            return context.dispatch('refresh');
        },
        async resolve(context, targetVersion) {
            requireString(targetVersion.minecraft);

            const localVersions = context.state.local;

            if (!targetVersion.forge && !targetVersion.liteloader) {
                const v = localVersions.find(v => v.minecraft === targetVersion.minecraft);
                if (!v) {
                    const err = {
                        type: 'MissingMinecraftVersion',
                        version: targetVersion.minecraft,
                    };
                    throw err;
                }
                return targetVersion.minecraft;
            }
            if (targetVersion.forge && !targetVersion.liteloader) {
                const forge = localVersions.find(v => v.forge === targetVersion.forge && !v.liteloader);
                if (!forge) {
                    const err = {
                        type: 'MissingForgeVersion',
                        version: targetVersion.forge,
                    };
                    throw err;
                }
                return forge.folder;
            }
            if (targetVersion.liteloader && !targetVersion.forge) {
                const liteloader = localVersions.find(v => v.liteloader === targetVersion.liteloader && !v.forge);
                if (!liteloader) {
                    const err = {
                        type: 'MissingLiteloaderVersion',
                        version: targetVersion.liteloader,
                    };
                    throw err;
                }
                return liteloader.folder;
            }
            if (targetVersion.liteloader && targetVersion.forge) {
                const v = localVersions.find((v => v.liteloader === targetVersion.liteloader && v.forge === targetVersion.forge));
                if (v) { return v.folder; }
                const forge = localVersions.find(v => v.forge === targetVersion.forge);
                const liteloader = localVersions.find(v => v.liteloader === targetVersion.liteloader);

                if (!forge) {
                    const err = {
                        type: 'MissingForgeVersion',
                        version: targetVersion.forge,
                    };
                    throw err;
                }
                if (!liteloader) {
                    const err = {
                        type: 'MissingLiteloaderVersion',
                        version: targetVersion.liteloader,
                    };
                    throw err;
                }

                const root = new MinecraftFolder(context.rootState.root);
                const targetId = targetVersion.folder || getExpectVersion(targetVersion.minecraft, targetVersion.forge, targetVersion.liteloader);

                const extended = await Version.extendsVersion(targetId,
                    await Version.parse(root, forge.folder), await Version.parse(root, liteloader.folder));

                const targetJSON = root.getVersionJson(targetId);

                await ensureFile(targetJSON);
                await fs.writeFile(targetJSON, JSON.stringify(extended, null, 4));

                return targetId;
            }

            throw new Error('');
        },
        async refresh(context) {
            /**
             * Read local folder
             */
            const files = await context.dispatch('readFolder', 'versions', { root: true });

            if (files.length === 0) return;

            const versions = [];
            for (const versionId of files.filter(f => !f.startsWith('.'))) {
                try {
                    const resolved = await Version.parse(context.rootState.root, versionId);
                    const minecraft = resolved.client;
                    const forge = resolved.libraries.filter(l => l.name.startsWith('net.minecraftforge:forge'))
                        .map(l => l.name.split(':')[2].split('-')[1])[0] || '';
                    const liteloader = resolved.libraries.filter(l => l.name.startsWith('com.mumfrey:liteloader'))
                        .map(l => l.name.split(':')[2])[0] || '';

                    versions.push({
                        forge,
                        liteloader,
                        id: resolved.id,
                        minecraft,
                        folder: versionId,
                    });
                } catch (e) {
                    console.error(`An error occured during refresh local version ${versionId}`);
                    console.error(e);
                }
            }
            context.commit('local', versions);
        },

        async downloadLibraries(context, { libraries }) {
            const task = Task.create('downloadLibraries', installLibraries({ libraries }, context.rootState.root));
            return context.dispatch('task/execute', task, { root: true });
        },
        async checkDependencies(context, version) {
            const location = context.rootState.root;
            const resolved = await Version.parse(location, version);
            const task = Version.installDependenciesTask(resolved, location);
            const handle = await context.dispatch('task/execute', task, { root: true });
            return handle;
        },
    },
    modules: {
        minecraft: {
            ...base.modules.minecraft,
            actions: {
                async load(context) {
                    const data = await context.dispatch('getPersistence', { path: 'version.json' }, { root: true });
                    if (data) context.commit('update', data);
                    await context.dispatch('save');
                    context.dispatch('refresh');
                },
                save(context) {
                    return context.dispatch('setPersistence',
                        { path: 'version.json', data: { latest: context.state.latest, versions: context.state.versions, timestamp: context.state.timestamp } },
                        { root: true });
                },
                /**
                * Refresh the remote versions cache 
                */
                async refresh(context) {
                    const timed = { timestamp: context.state.timestamp, latest: { snapshot: '', release: '' }, versions: [] };
                    const metas = await Version.updateVersionMeta({ fallback: timed });
                    if (timed !== metas) {
                        context.commit('update', metas);
                    }
                    const files = await context.dispatch('readFolder', 'versions', { root: true });

                    if (files.length === 0) return;

                    /**
                     * @param {string} path
                     */
                    function checksum(path) {
                        const hash = createHash('sha1');
                        return new Promise((resolve, reject) => createReadStream(path)
                            .pipe(hash)
                            .on('error', (e) => { reject(new Error(e)); })
                            .once('finish', () => { resolve(hash.digest('hex')); }));
                    }
                    for (const versionId of files.filter(f => !f.startsWith('.'))) {
                        try {
                            const jsonPath = context.rootGetters.path('versions', versionId, `${versionId}.json`);
                            const json = await fs.readFile(jsonPath, { flag: 'r', encoding: 'utf-8' })
                                .then(b => b.toString()).then(JSON.parse);
                            if (json.inheritsFrom === undefined && json.assetIndex) {
                                const id = json.id;
                                const meta = context.state.versions[id];
                                const tokens = meta.url.split('/');
                                const sha1 = tokens[tokens.length - 2];
                                if (sha1 !== await checksum(jsonPath)) {
                                    const taskId = await context.dispatch('download', meta);
                                    await context.dispatch('task/wait', taskId, { root: true });
                                }
                            }
                        } catch (e) {
                            console.error(`An error occured during check minecraft version ${versionId}`);
                            console.error(e);
                        }
                    }
                },

                /**
                 * Download and install a minecract version
                 */
                async download(context, meta) {
                    const id = meta.id;

                    const task = Version.downloadVersionTask('client', meta, context.rootState.root);
                    const taskId = await context.dispatch('task/execute', task, { root: true });

                    context.dispatch('task/wait', taskId, { root: true })
                        .then(() => context.dispatch('version/refresh', undefined, { root: true }))
                        .catch((e) => {
                            console.warn(`An error ocurred during download version ${id}`);
                            console.warn(e);
                        });

                    return taskId;
                },
            },
        },
        forge: {
            ...base.modules.forge,

            actions: {
                async load(context) {
                    const struct = await context.dispatch('getPersistence', { path: 'forge-versions.json' }, { root: true });
                    if (struct) {
                        context.commit('load', struct);
                    }
                    context.dispatch('refresh').then(() => context.dispatch('save'), () => context.dispatch('save'));
                },
                save(context) {
                    return context.dispatch('setPersistence', { path: 'forge-versions.json', data: { mcversions: context.state.mcversions } }, { root: true });
                },
                /**
                 * download a specific version from version metadata
                 */
                async download(context, meta) {
                    const task = Forge.installTask(meta, context.rootState.root);
                    const id = await context.dispatch('task/execute', task, { root: true });
                    context.dispatch('task/wait', id, { root: true })
                        .then(() => context.dispatch('version/refresh', undefined, { root: true }))
                        .catch((e) => {
                            console.warn(`An error ocurred during download version ${id}`);
                            console.warn(e);
                        });
                    return id;
                },

                /**
                * Refresh the remote versions cache 
                */
                async refresh(context) {
                    const prof = context.rootState.profile.all[context.rootState.profile.id];
                    const mcversion = prof.mcversion;
                    const fallback = context.state.mcversions[mcversion]
                        ? context.state.mcversions[mcversion]
                        : undefined;
                    const result = await ForgeWebPage.getWebPage({ mcversion, fallback });
                    console.log(result);
                    if (result === fallback) return;
                    context.commit('update', result);
                },
            },
        },
        liteloader: {
            ...base.modules.liteloader,
            actions: {
                async load(context) {
                    const struct = await context.dispatch('getPersistence', { path: 'lite-versions.json' }, { root: true });
                    if (struct) context.commit('update', struct);
                    context.dispatch('refresh').then(() => context.dispatch('save'), () => context.dispatch('save'));
                },
                save(context) {
                    return context.dispatch('setPersistence', { path: 'lite-versions.json', data: context.state }, { root: true });
                },
                async download(context, meta) {
                    const task = LiteLoader.installAndCheckTask(meta, context.rootState.root);
                    const handle = await context.dispatch('task/execute', task, { root: true });
                    context.dispatch('task/wait', handle, { root: true }).finally(() => {
                        context.dispatch('version/refresh', undefined, { root: true });
                    });
                    return handle;
                },
                async refresh(context) {
                    const option = context.state.timestamp === '' ? undefined : {
                        fallback: context.state,
                    };
                    const remoteList = await LiteLoader.VersionMetaList.update(option);
                    context.commit('update', remoteList);
                },
            },
        },
    },
};

export default mod;
