import {
    Forge, LiteLoader, Version, ForgeWebPage,
} from 'ts-minecraft';

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
                    let forge = resolved.libraries.filter(l => l.name.startsWith('net.minecraftforge:forge'))[0];
                    if (forge) {
                        forge = forge.name.split(':')[2].split('-')[1];
                    }
                    let liteloader = resolved.libraries.filter(l => l.name.startsWith('com.mumfrey:liteloader'))[0];
                    if (liteloader) {
                        liteloader = liteloader.name.split(':')[2];
                    }
                    versions.push({
                        forge,
                        liteloader,
                        id: resolved.id,
                        jar: resolved.jar,
                        minecraft,
                    });
                } catch (e) {
                    console.error('An error occured during refresh local versions');
                    console.error(e);
                }
            }
            context.commit('local', versions);
        },

        /**
         * @param {string} version 
         */
        checkDependency(context, version) {
            const location = context.rootState.root;
            return Version.checkDependencies(version, location);
        },
    },
    modules: {
        minecraft: {
            ...base.modules.minecraft,
            actions: {
                async load(context) {
                    const data = await context.dispatch('getPersistence', { path: 'version.json' }, { root: true });
                    if (data) context.commit('update', data);
                    await context.dispatch('refresh');
                    await context.dispatch('save');
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
                    const timed = { timestamp: context.state.timestamp };
                    const metas = await Version.updateVersionMeta({ fallback: timed });
                    if (timed === metas) return;
                    context.commit('update', metas);
                },
                /**
                 * Download and install a minecract version
                 */
                async download(context, meta) {
                    const id = meta.id;
                    context.commit('status', { version: meta, status: 'loading' });

                    // const exists = await context.dispatch('existsAll', [`versions/${id}`, `versions/${id}/${id}.jar`, `versions/${id}/${id}.json`], { root: true });
                    // if (exists) return;

                    const task = Version.installTask('client', meta, context.rootGetters.root);

                    try {
                        await context.dispatch('task/execute', task, { root: true });
                        context.commit('status', { version: meta, status: 'local' });
                    } catch (e) {
                        console.warn(`An error ocurred during download version ${id}`);
                        console.warn(e);
                        context.commit('status', { version: meta, status: 'remote' });
                    }
                },

                init(context) {
                    const localVersions = {};
                    context.rootState.version.local.forEach((ver) => {
                        if (ver.minecraft) localVersions[ver.minecraft] = true;
                    });
                    const statusMap = {};
                    for (const ver of Object.keys(context.state.versions)) {
                        statusMap[ver] = localVersions[ver] ? 'local' : 'remote';
                    }

                    context.commit('statusAll', statusMap);
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
                    return context.dispatch('refresh').then(() => context.dispatch('save'), () => context.dispatch('save'));
                },
                save(context) {
                    return context.dispatch('setPersistence', { path: 'forge-versions.json', data: { mcversions: context.state.mcversions } }, { root: true });
                },
                init(context) {
                    const localForgeVersion = {};
                    context.rootState.version.local.forEach((ver) => {
                        if (ver.forge) localForgeVersion[ver.forge] = true;
                    });
                    const statusMap = {};

                    Object.keys(context.state.mcversions).forEach((mcversion) => {
                        const container = context.state.mcversions[mcversion];
                        if (container.versions) {
                            container.versions.forEach((version) => {
                                statusMap[version.version] = localForgeVersion[version.version] ? 'local' : 'remote';
                            });
                        }
                    });
                    context.commit('statusAll', statusMap);
                },
                /**
                 * download a specific version from version metadata
                 */
                async download(context, meta) {
                    const task = Forge.installAndCheckTask(meta, context.rootGetters.root, true);
                    context.commit('status', { version: meta.version, status: 'loading' });
                    return context.dispatch('task/execute', task, { root: true })
                        .then(() => {
                            context.commit('status', { version: meta.version, status: 'local' });
                        }).catch((e) => {
                            console.error(e);
                            context.commit('status', { version: meta.version, status: 'remote' });
                        });
                },

                /**
                * Refresh the remote versions cache 
                */
                async refresh(context) {
                    const prof = context.rootState.profile.all[context.rootState.profile.id];
                    const mcversion = prof.mcversion;
                    const fallback = { timestamp: context.state.mcversions[mcversion].timestamp };
                    const result = await ForgeWebPage.getWebPage({ mcversion, fallback });
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
                    return context.dispatch('refresh').then(() => context.dispatch('save'), () => context.dispatch('save'));
                },
                save(context) {
                    return context.dispatch('setPersistence', { path: 'lite-versions.json', data: context.state }, { root: true });
                },
                init(context) {
                    // refresh local version existances/status map
                    const localVers = {};
                    const localArr = context.rootState.version.local;
                    localArr.forEach((ver) => {
                        if (ver.liteloader) localVers[ver.liteloader] = true;
                    });
                    const statusMap = {};
                    Object.keys(context.state.versions).forEach((versionId) => {
                        const verObj = context.state.versions[versionId];
                        if (verObj.snapshot) {
                            statusMap[verObj.snapshot.version] = localVers[verObj.snapshot.version] ? 'local' : 'remote';
                        }
                        if (verObj.release) {
                            statusMap[verObj.release.version] = localVers[verObj.release.version] ? 'local' : 'remote';
                        }
                    });
                    context.commit('statusAll', statusMap);
                },
                /**
                 * @param {ActionContext<VersionsState.Inner>} context 
                 */
                async download(context, meta) {
                    const task = LiteLoader
                        .installAndCheckTask(meta, context.rootGetters.root, true);
                    context.commit('status', { version: meta.version, status: 'loading' });
                    return context.dispatch('task/execute', task, { root: true })
                        .then(() => {
                            context.commit('status', { version: meta.version, status: 'local' });
                        }, () => {
                            context.commit('status', { version: meta.version, status: 'remote' });
                        });
                },
                $refresh: {
                    root: true,
                    /**
                     * @param {ActionContext<VersionsState.Inner>} context 
                     */
                    handler(context) {
                        // return $refresh(context)
                    },
                },
                /**
                 * @param {ActionContext<VersionsState.Inner>} context 
                 */
                async refresh(context) {
                    const option = context.state.date === '' ? undefined : {
                        fallback: { date: context.state.date || '', list: context.state.list || [] },
                    };
                    const remoteList = await LiteLoader.VersionMetaList.update(option);
                    context.commit('update', remoteList);
                },
            },
        },
    },
};

export default mod;