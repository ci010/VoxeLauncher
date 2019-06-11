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
    state: base.state,
    getters: base.getters,
    mutations: base.mutations,
    actions: {
        async load(context) {
            const [mc, forge, liteloader] = await Promise.all([
                context.dispatch('getPersistence', { path: 'version.json' }),
                context.dispatch('getPersistence', { path: 'forge-versions.json' }),
                context.dispatch('getPersistence', { path: 'lite-versions.json' }),
                context.dispatch('refreshVersions'),
            ]);
            if (mc) context.commit('minecraftMetadata', mc);
            if (forge) context.commit('forgeMetadata', forge);
            if (liteloader) context.commit('liteloaderMetadata', liteloader);
        },
        async init(context) {
            context.dispatch('refreshMinecraft');
            context.dispatch('refreshLiteloader');
            context.dispatch('refreshForge');
        },
        async save(context, { mutation }) {
            switch (mutation) {
                case 'minecraftMetadata':
                    await context.dispatch('setPersistence', {
                        path: 'version.json',
                        data: context.state.minecraft,
                    });
                    break;
                case 'forgeMetadata':
                    await context.dispatch('setPersistence', {
                        path: 'forge-versions.json',
                        data: context.state.forge,
                    });
                    break;
                case 'liteloaderMetadata':
                    await context.dispatch('setPersistence', {
                        path: 'lite-versions.json',
                        data: context.state.liteloader,
                    });
                    break;
                default:
            }
        },
        async resolveVersion(context, targetVersion) {
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
            await Promise.all([
                context.dispatch('refreshVersions'),
                context.dispatch('refreshMinecraft'),
                context.dispatch('refreshForge'),
                context.dispatch('refreshLiteloader'),
            ]);
        },

        /**
         * Refresh the remote versions cache 
         */
        async refreshMinecraft(context) {
            context.commit('refreshingMinecraft', true);
            const timed = context.state.minecraft;
            const metas = await Version.updateVersionMeta({ fallback: context.state.minecraft });
            if (timed !== metas) {
                context.commit('minecraftMetadata', metas);
            }
            context.commit('refreshingMinecraft', false);
            
            const files = await context.dispatch('readFolder', 'versions');

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
                        const meta = context.state.minecraft.versions.find(v => v.id === id);
                        if (meta) {
                            const tokens = meta.url.split('/');
                            const sha1 = tokens[tokens.length - 2];
                            if (sha1 !== await checksum(jsonPath)) {
                                const taskId = await context.dispatch('installMinecraft', meta);
                                await context.dispatch('waitTask', taskId);
                            }
                        }
                    }
                } catch (e) {
                    console.error(`An error occured during check minecraft version ${versionId}`);
                    console.error(e);
                }
            }
        },

        async installLibraries(context, { libraries }) {
            const task = Task.create('downloadLibraries', installLibraries({ libraries }, context.rootState.root));
            return context.dispatch('executeTask', task);
        },

        async installAssets(context, version) {
            const ver = await Version.parse(context.rootState.root, version);
            const task = Version.installAssetsTask(ver, context.rootState.root);
            return context.dispatch('executeTask', task);
        },

        async installDependencies(context, version) {
            const location = context.rootState.root;
            const resolved = await Version.parse(location, version);
            const task = Version.installDependenciesTask(resolved, location);
            const handle = await context.dispatch('executeTask', task);
            return handle;
        },

        /**
         * Download and install a minecract version
         */
        async installMinecraft(context, meta) {
            const id = meta.id;

            const task = Version.downloadVersionTask('client', meta, context.rootState.root);
            const taskId = await context.dispatch('executeTask', task);

            context.dispatch('waitTask', taskId)
                .then(() => context.dispatch('refreshVersions'))
                .catch((e) => {
                    console.warn(`An error ocurred during download version ${id}`);
                    console.warn(e);
                });

            return taskId;
        },

        /**
         * download a specific version from version metadata
         */
        async installForge(context, meta) {
            const task = Forge.installTask(meta, context.rootState.root);
            const id = await context.dispatch('executeTask', task);
            context.dispatch('waitTask', id)
                .then(() => context.dispatch('refreshVersions'))
                .catch((e) => {
                    console.warn(`An error ocurred during download version ${id}`);
                    console.warn(e);
                });
            return id;
        },

        async installLiteloader(context, meta) {
            const task = LiteLoader.installAndCheckTask(meta, context.rootState.root);
            const handle = await context.dispatch('executeTask', task);
            context.dispatch('waitTask', handle).finally(() => {
                context.dispatch('refreshLiteloader', undefined);
            });
            return handle;
        },


        /**
        * Refresh the remote versions cache 
        */
        async refreshForge(context) {
            context.dispatch('refreshForge', true);
            // TODO: change to handle the profile not ready
            const prof = context.rootState.profile.all[context.rootState.profile.id];
            if (!prof) return;
            const mcversion = prof.mcversion;
            const fallback = context.state.forge[mcversion]
                ? context.state.forge[mcversion]
                : undefined;
            const result = await ForgeWebPage.getWebPage({ mcversion, fallback });
            if (result !== fallback) {
                context.commit('forgeMetadata', result);
            }
            context.dispatch('refreshForge', false);
        },
        async refreshLiteloader(context) {
            context.dispatch('refreshForge', true);
            const option = context.state.liteloader.timestamp === '' ? undefined : {
                fallback: context.state.liteloader,
            };
            const remoteList = await LiteLoader.VersionMetaList.update(option);
            if (remoteList !== context.state.liteloader) {
                context.commit('liteloaderMetadata', remoteList);
            }
            context.dispatch('refreshForge', false);
        },
        async refreshVersions(context) {
            /**
            * Read local folder
            */
            const files = await context.dispatch('readFolder', 'versions');

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
            context.commit('localVersions', versions);
        },

    },
};

export default mod;
