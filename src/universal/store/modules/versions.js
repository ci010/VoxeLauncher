import {
    Forge, LiteLoader, Version, VersionMeta,
} from 'ts-minecraft';

/**
 * @type {import('./versions').VersionModule}
 */
const mod = {
    namespaced: true,
    state: () => ({
        /**
         * @type {{forge: string, liteloader: string, minecra: string, id: string, jar: string }[]}
         * local versions
         */
        local: [],
        libraryHost: {},
        assetHost: '',
    }),
    mutations: {
        local(state, local) {
            state.local = local;
        },
    },
    actions: {
        load(context) {
            return context.dispatch('refresh');
        },
        async refresh(context) {
            /**
             * Read local folder
             */
            const files = await context.dispatch('readFolder', { path: 'versions' }, { root: true });

            const versions = [];
            for (const ver of files) {
                try {
                    const resolved = await Version.parse(context.rootGetters.root, ver);
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
            // const task = Version.checkDependenciesTask(version, location);
            // context.dispatch('')
            return Version.checkDependency(version, location);
        },
    },
    modules: {
        minecraft: {
            namespaced: true,
            state: () => ({
                date: '',
                list: {
                    versions: [],
                    latest: {
                        snapshot: '',
                        release: '',
                    },
                },
                status: {},
            }),
            getters: {
                /**
                 * all versions
                 */
                versions: state => state.list.versions,
                /**
                 * latest snapshot
                 */
                snapshot: state => state.list.latest.snapshot,
                /**
                 * latest release
                 */
                release: state => state.list.latest.release,
                /**
                 * get status of a specific version
                 */
                status: state => version => state.status[version],
            },
            mutations: {
                update(state, { date, list }) {
                    state.date = Object.freeze(date);
                    if (!list) return;
                    if (list.versions) {
                        state.list.versions = Object.freeze(list.versions);
                    }
                    if (list.latest) {
                        if (list.latest.snapshot) state.list.latest.snapshot = list.latest.snapshot;
                        if (list.latest.release) state.list.latest.release = list.latest.release;
                    }
                },
                status(state, { version, status }) {
                    state.status[version] = status;
                },
                allStatus(state, status) {
                    for (const id of Object.keys(status)) {
                        state.status[id] = status[id];
                    }
                },
            },
            actions: {
                /**
                * @param {ActionContext<VersionsState.Inner>} context 
                */
                async load(context, payload) {
                    const data = await context.dispatch('read', { path: 'version.json', type: 'json', fallback: undefined }, { root: true });
                    if (data) context.commit('update', { date: data.date, list: data.list });
                    await context.dispatch('refresh');
                    await context.dispatch('save');
                },
                /**
                * @param {ActionContext<VersionsState.Inner>} context 
                */
                save(context, payload) {
                    return context.dispatch('write', {
                        path: 'version.json',
                        data: JSON.stringify({
                            list: context.state.list,
                            date: context.state.date,
                        }),
                    }, { root: true });
                },
                /**
                 * Download and install a minecract version
                 *  
                 * @param {ActionContext<VersionsState.Inner>} context 
                 * @param {VersionMeta} meta
                 */
                async download(context, meta) {
                    const id = meta.id;
                    context.commit('status', { version: meta, status: 'loading' });
                    const exist = await context.dispatch('exist', [`versions/${id}`, `versions/${id}/${id}.jar`, `versions/${id}/${id}.json`], { root: true });
                    if (exist) return Promise.resolve();
                    const task = Version.installTask('client', meta, context.rootGetters.root);
                    await context.dispatch('task/listen', task, { root: true });
                    return task.execute()
                        .then(() => {
                            context.commit('status', { version: meta, status: 'local' });
                        })
                        .catch((e) => {
                            console.warn(`An error ocurred during download version ${id}`);
                            console.warn(e);
                            context.commit('status', { version: meta, status: 'remote' });
                        });
                },
                /**
                 * @param {ActionContext<VersionsState.Inner>} context 
                 */
                init(context) {
                    const localVersions = {};
                    context.rootState.versions.local.forEach((ver) => {
                        if (ver.minecraft) localVersions[ver.minecraft] = true;
                    });
                    const statusMap = {};
                    for (const ver of context.state.list.versions) {
                        statusMap[ver.id] = localVersions[ver.id] ? 'local' : 'remote';
                    }

                    context.commit('allStatus', statusMap);
                },
                /**
                 * Refresh the remote versions cache 
                 * @param {ActionContext<VersionsState.Inner>} context 
                 */
                async refresh(context) {
                    const container = {
                        date: context.state.date,
                        list: context.state.list,
                    };
                    /**
                     * Update from internet
                     */
                    let metas = container;
                    metas = await Version.updateVersionMeta({ fallback: container });
                    context.commit('update', metas);
                },
            },
        },
        forge: {
            namespaced: true,
            state: () => ({
                date: '',
                list: {
                    mcversion: {},
                    promos: {},
                    number: {},
                },
                status: {},
            }),
            getters: {
                /**
                 * @type { branch: string | null, build: number, files: [string, string, string][], mcversion: string, modified: number, version: string, type: string} 
                 * get version by minecraft version
                 */
                versions: state => version => (state.list.mcversion[version] || []),

                /**
                 * get latest version by minecraft version
                 */
                latest: state =>
                    version => state.list.number[state.list.promos[`${version}-latest`]],
                /**
                 * get recommended version by minecraft version
                 */
                recommended: state =>
                    version => state.list.number[state.list.promos[`${version}-recommended`]],
                /**
                 * get version status by actual forge version
                 */
                status: state => version => state.status[version] || 'remote',
            },
            mutations: {
                update(state, list) {
                    if (list.list) {
                        state.list.mcversion = Object.freeze(list.list.mcversion);
                        state.list.promos = Object.freeze(list.list.promos);
                        state.list.number = Object.freeze(list.list.number);
                    }
                    if (list.date) {
                        state.date = Object.freeze(list.date);
                    }
                },
                allStatus(state, allStatus) {
                    Object.keys(allStatus).forEach((key) => {
                        state.status[key] = allStatus[key];
                    });
                },
                status(state, { version, status }) {
                    state.status[version] = status;
                },
            },
            actions: {
                /**
                * @param {ActionContext<VersionsState.Inner>} context 
                */
                async load(context, payload) {
                    const struct = await context.dispatch('read', { path: 'forge-versions.json', fallback: {}, type: 'json' }, { root: true });
                    context.commit('update', struct);
                    return context.dispatch('refresh').then(() => context.dispatch('save'), () => context.dispatch('save'));
                },
                /**
                 * @param {ActionContext<VersionsState.Inner>} context 
                 */
                save(context, payload) {
                    const data = JSON.stringify(context.state);
                    return context.dispatch('write', { path: 'forge-versions.json', data }, { root: true });
                },
                /**
                 * @param {ActionContext<VersionsState.Inner>} context 
                 */
                init(context) {
                    const struct = Object.assign({}, context.state);
                    if (!struct.list) return;
                    const localForgeVersion = {};
                    context.rootState.versions.local.forEach((ver) => {
                        if (ver.forge) localForgeVersion[ver.forge] = true;
                    });
                    const statusMap = {};
                    Object.keys(struct.list.number).forEach((key) => {
                        const verObj = struct.list.number[key];
                        statusMap[verObj.version] = localForgeVersion[verObj.version] ? 'local' : 'remote';
                    });
                    context.commit('allStatus', statusMap);
                },
                /**
                 * download a specific version from version metadata
                 * 
                 * @param {ActionContext<VersionsState.Inner>} context 
                 */
                async download(context, meta) {
                    const task = Forge.installAndCheckTask(meta, context.rootGetters.root, true);
                    context.commit('status', { key: meta.build, status: 'loading' });
                    task.name = `install.${meta.id}`;
                    context.dispatch('task/listen', task, { root: true });
                    return task.execute().then(() => {
                        console.log('install forge suc');
                        context.commit('status', { key: meta.build, status: 'local' });
                    }).catch((e) => {
                        console.log('install forge error');
                        console.log(e);
                        context.commit('status', { key: meta.build, status: 'remote' });
                    });
                },
                /**
                * Refresh the remote versions cache 
                * @param {ActionContext<VersionsState.Inner>} context 
                */
                async refresh(context) {
                    const remoteList = await Forge.VersionMetaList.update({
                        fallback: { date: context.state.date || '', list: context.state.list },
                    });
                    for (const num of Object.keys(remoteList.number)) {
                        const ver = remoteList.number[num];
                        if (remoteList.promos[`${ver.version}-recommended`] === num) {
                            ver.type = 'recommended';
                        } else if (remoteList.promos[`${ver.version}-latest`] === num) {
                            ver.type = 'latest';
                        } else {
                            ver.type = 'snapshot';
                        }
                    }
                    context.commit('update', remoteList);
                },
            },
        },
        liteloader: {
            namespaced: true,
            state: () => ({
                list: {
                    versions: {},
                },
                date: '',
                status: {},
            }),
            getters: {
                /**
                 * get version from mc version
                 */
                versions: state => version => state.list.versions[version] || [],
                /**
                 * get status of a specific version
                 */
                status: state => version => state.status[version],
            },
            mutations: {
                update(state, content) {
                    state.list = Object.freeze(content.list);
                    state.date = Object.freeze(content.date);
                },
                allStatus(state, status) {
                    for (const id of Object.keys(status)) {
                        state.status[id] = status[id];
                    }
                },
                status(state, { version, status }) {
                    state.status[version] = status;
                },
            },
            actions: {
                /**
                 * @param {ActionContext<VersionsState.Inner>} context 
                 */
                async load(context) {
                    const struct = await context.dispatch('read', { path: 'lite-versions.json', fallback: {}, type: 'json' }, { root: true });
                    context.commit('update', struct);
                    return context.dispatch('refresh').then(() => context.dispatch('save'), () => context.dispatch('save'));
                },
                /**
                 * @param {ActionContext<VersionsState.Inner>} context 
                 */
                init(context) {
                    const struct = Object.assign({}, context.state);
                    const localVers = {};
                    const localArr = context.rootState.versions.local;
                    localArr.forEach((ver) => {
                        if (ver.liteloader) localVers[ver.liteloader] = true;
                    });
                    const statusMap = {};
                    Object.keys(struct.list.versions).forEach((versionId) => {
                        const verObj = struct.list.versions[versionId];
                        if (verObj.snapshot) {
                            statusMap[verObj.snapshot.version] = localVers[verObj.snapshot.version] ? 'local' : 'remote';
                        }
                        if (verObj.release) {
                            statusMap[verObj.release.version] = localVers[verObj.release.version] ? 'local' : 'remote';
                        }
                    });
                    context.commit('allStatus', statusMap);
                },
                /**
                 * @param {ActionContext<VersionsState.Inner>} context 
                 */
                save(context) {
                    const data = JSON.stringify(context.state);
                    return context.dispatch('write', { path: 'lite-versions.json', data }, { root: true });
                },
                /**
                 * @param {ActionContext<VersionsState.Inner>} context 
                 */
                async download(context, meta) {
                    const task = LiteLoader
                        .installAndCheckTask(meta, context.rootGetters.root, true);
                    context.commit('status', { version: meta.version, status: 'loading' });
                    await context.dispatch('task/listen', task, { root: true });
                    return task.execute().then(() => {
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
