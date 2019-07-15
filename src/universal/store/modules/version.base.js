/**
 * @type {import('./version).VersionModule}
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
    modules: {
        minecraft: {
            namespaced: true,
            state: () => ({
                latest: {
                    snapshot: '',
                    release: '',
                },
                versions: {},
            }),
            getters: {
                /**
                 * latest snapshot
                 */
                snapshot: state => state.versions[state.latest.snapshot],
                /**
                 * latest release
                 */
                release: state => state.versions[state.latest.release],
                /**
                 * get status of a specific version
                 */
                status: (_, getters) => version => getters.statuses[version],

                statuses: (state, _, rootStates) => {
                    const localVersions = {};
                    rootStates.version.local.forEach((ver) => {
                        if (ver.minecraft) localVersions[ver.minecraft] = true;
                    });
                    const statusMap = {};
                    for (const ver of Object.keys(state.versions)) {
                        statusMap[ver] = localVersions[ver] ? 'local' : 'remote';
                    }
                    return statusMap;
                },
            },
            mutations: {
                update(state, metas) {
                    state.timestamp = metas.timestamp;
                    if (metas.latest) {
                        state.latest.release = metas.latest.release || state.latest.release;
                        state.latest.snapshot = metas.latest.snapshot || state.latest.snapshot;
                    }
                    if (metas.versions) {
                        const versions = {};

                        Object.keys(state.versions)
                            .sort((a, b) => new Date(state.versions[b].releaseTime).getTime() - new Date(state.versions[a].releaseTime).getTime())
                            .forEach((k) => {
                                const v = state.versions[k];
                                versions[v.id] = v;
                            });
                        Object.keys(metas.versions)
                            .sort((a, b) => new Date(metas.versions[b].releaseTime).getTime() - new Date(metas.versions[a].releaseTime).getTime())
                            .forEach((k) => {
                                const v = metas.versions[k];
                                versions[v.id] = v;
                            });

                        Object.freeze(versions);
                        state.versions = versions;
                    }
                },
            },
        },
        forge: {
            namespaced: true,
            state: () => ({
                mcversions: {},
            }),
            getters: {
                /**
                 * @type { branch: string | null, build: number, files: [string, string, string][], mcversion: string, modified: number, version: string, type: string} 
                 * get version by minecraft version
                 */
                versions: state => version => (state.mcversions[version] || []),

                /**
                 * get latest version by minecraft version
                 */
                latest: state => (version) => {
                    const versions = state.mcversions[version];
                    const index = versions.latest;
                    return versions.versions[index];
                },
                /**
                 * get recommended version by minecraft version
                 */
                recommended: state => (version) => {
                    const versions = state.mcversions[version];
                    const index = versions.recommended;
                    return versions.versions[index];
                },
                /**
                 * get version status by actual forge version
                 */
                status: (_, getters) => version => getters.statuses[version] || 'remote',

                statuses: (state, _, rootState) => {
                    const statusMap = {};
                    const localForgeVersion = {};
                    rootState.version.local.forEach((ver) => {
                        if (ver.forge) localForgeVersion[ver.forge] = true;
                    });

                    Object.keys(state.mcversions).forEach((mcversion) => {
                        const container = state.mcversions[mcversion];
                        if (container.versions) {
                            container.versions.forEach((version) => {
                                statusMap[version.version] = localForgeVersion[version.version] ? 'local' : 'remote';
                            });
                        }
                    });
                    return statusMap;
                },
            },
            mutations: {
                update(state, meta) {
                    const { mcversion, versions } = meta.mcversion;
                    if (!state.mcversions[mcversion]) state.mcversions[mcversion] = {};
                    const mcversionContainer = state.mcversions[mcversion];
                    mcversionContainer.timestamp = meta.timestamp;

                    let latest = 0;
                    let recommended = 0;
                    for (let i = 0; i < versions.length; i++) {
                        const version = versions[i];
                        if (version.type === 'recommended') recommended = i;
                        else if (version.type === 'latest') latest = i;
                    }
                    mcversionContainer.versions = versions;
                    mcversionContainer.mcversion = mcversion;
                    mcversionContainer.latest = latest;
                    mcversionContainer.recommended = recommended;
                },
                load(state, meta) {
                    Object.assign(state.mcversions, meta.mcversions);
                },
            },
        },
        liteloader: {
            namespaced: true,
            state: () => ({
                status: {},
                meta: {
                    description: '',
                    authors: '',
                    url: '',
                    updated: '',
                    updatedTime: -1,
                },
                versions: {},
            }),
            getters: {
                /**
                 * get version from mc version
                 */
                versions: state => version => state.versions[version] || [],
                /**
                 * get status of a specific version
                 */
                status: state => version => state.status[version],
            },
            mutations: {
                update(state, content) {
                    if (content.meta) {
                        state.meta = content.meta;
                    }
                    if (content.versions) {
                        state.versions = content.versions;
                    }
                    state.timestamp = content.timestamp;
                },
                // statusAll(state, status) {
                //     for (const id of Object.keys(status)) {
                //         state.status[id] = status[id];
                //     }
                // },
                // status(state, { version, status }) {
                //     state.status[version] = status;
                // },
            },
        },
    },
};

export default mod;
