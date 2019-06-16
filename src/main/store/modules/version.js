import { createHash } from 'crypto';
import { createReadStream, promises as fs, promises, existsSync } from 'fs';
import { ensureFile, remove } from 'main/utils/fs';
import { Forge, ForgeWebPage, LiteLoader, MinecraftFolder, Version } from 'ts-minecraft';
import base from 'universal/store/modules/version';
import { requireString } from 'universal/utils/object';
import { getExpectVersion } from 'universal/utils/versions';
import { shell } from 'electron';

/**
 * @type {import('universal/store/modules/version').VersionModule}
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
            context.dispatch('refreshForge');
            context.dispatch('refreshLiteloader');
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
            const task = Version.installLibrariesDirectTask(libraries, context.rootState.root);
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

        async getForgeWebPage(context, mcversion) {
            if (!context.state.forge[mcversion]) {
                await context.dispatch('refreshForge', mcversion);
            }
            return context.state.forge[mcversion];
        },

        /**
        * Refresh the remote versions cache 
        */
        async refreshForge(context, mcversion) {
            context.commit('refreshingForge', true);
            // TODO: change to handle the profile not ready
            let version = mcversion;
            if (!mcversion) {
                const prof = context.rootState.profile.all[context.rootState.profile.id];
                if (!prof) return;
                version = prof.mcversion;
            }

            const cur = context.state.forge[version];
            try {
                const result = await ForgeWebPage.getWebPage({ mcversion: version, fallback: cur });
                if (result !== cur) {
                    context.commit('forgeMetadata', result);
                }
            } finally {
                context.commit('refreshingForge', false);
            }
        },
        async refreshLiteloader(context) {
            context.commit('refreshingLiteloader', true);
            const option = context.state.liteloader.timestamp === '' ? undefined : {
                fallback: context.state.liteloader,
            };
            const remoteList = await LiteLoader.VersionMetaList.update(option);
            if (remoteList !== context.state.liteloader) {
                context.commit('liteloaderMetadata', remoteList);
            }
            context.commit('refreshingLiteloader', false);
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
        async showVersionDirectory(context, version) {
            requireString(version);
            shell.openItem(context.rootGetters.path('versions', version));
        },
        async showVersionsDirectory(context) {
            shell.openItem(context.rootGetters.path('versions'));
        },
        async deleteVersion(context, version) {
            if (existsSync(context.rootGetters.path('versions', version))) {
                await remove(context.rootGetters.path('versions', version));
            }
        },
    },
};

export default mod;
