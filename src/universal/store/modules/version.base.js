import { fitin } from 'universal/utils/object';

/**
 * @type {import('./version').VersionModule}
 */
const mod = {
    state: {
        /**
         * local versions
         */
        local: [],
        refreshingMinecraft: false,
        refreshingForge: false,
        refreshingLiteloader: false,
        minecraft: {
            timestamp: '',
            latest: {
                snapshot: '',
                release: '',
            },
            versions: [],
        },
        forge: {

        },
        liteloader: {
            timestamp: '',
            meta: {
                description: '',
                authors: '',
                url: '',
                updated: '',
                updatedTime: 0,
            },
            versions: {},
        },
    },
    getters: {
        /**
         * latest snapshot
         */
        minecraftSnapshot: state => state.minecraft.versions.find(v => v.id === state.minecraft.latest.snapshot),
        /**
         * latest release
         */
        minecraftRelease: state => state.minecraft.versions.find(v => v.id === state.minecraft.latest.release),

        minecraftVersion: state => version => state.minecraft.versions.find(v => v.id === version),

        minecraftStatuses: (state, _, rootStates) => {
            /**
             * @type {{[k:string]:boolean}}
             */
            const localVersions = {};
            rootStates.version.local.forEach((ver) => {
                if (ver.minecraft) localVersions[ver.minecraft] = true;
            });
            /**
             * @type {{[key:string]: import('./version').Status}}
             */
            const statusMap = {};
            for (const ver of state.minecraft.versions) {
                statusMap[ver.id] = localVersions[ver.id] ? 'local' : 'remote';
            }
            return statusMap;
        },
        forgeVersionsOf: state => version => (state.forge[version]),
        forgeLatestOf: state => (version) => {
            const versions = state.forge[version];
            return versions.versions.find(v => v.type === 'latest');
        },
        forgeRecommendedOf: state => (version) => {
            const versions = state.forge[version];
            return versions.versions.find(v => v.type === 'recommended');
        },
        forgeStatuses: (state, _, rootState) => {
            /**
             * @type {{[key:string]: import('./version').Status}}
             */
            const statusMap = {};
            /**
            * @type {{[k:string]:boolean}}
            */
            const localForgeVersion = {};
            rootState.version.local.forEach((ver) => {
                if (ver.forge) localForgeVersion[ver.forge] = true;
            });

            Object.keys(state.forge).forEach((mcversion) => {
                const container = state.forge[mcversion];
                if (container.versions) {
                    container.versions.forEach((version) => {
                        statusMap[version.version] = localForgeVersion[version.version] ? 'local' : 'remote';
                    });
                }
            });
            return statusMap;
        },
        liteloaderVersionsOf: state => version => state.liteloader.versions[version],
    },
    mutations: {
        refreshingMinecraft(state, r) { state.refreshingMinecraft = r; },
        refreshingForge(state, r) { state.refreshingForge = r; },
        refreshingLiteloader(state, r) { state.refreshingLiteloader = r; },

        localVersions(state, local) {
            state.local = local;
        },
        minecraftMetadata(state, metadata) {
            fitin(state.minecraft, metadata);
        },
        forgeMetadata(state, metadata) {
            const { mcversion, versions } = metadata;
            // const container = state.forge[mcversion] || {};
            // container.timestamp = metadata.timestamp;

            // let latest = 0;
            // let recommended = 0;
            // for (let i = 0; i < versions.length; i++) {
            //     const version = versions[i];
            //     if (version.type === 'recommended') recommended = i;
            //     else if (version.type === 'latest') latest = i;
            // }
            // container.versions = versions;
            // container.mcversion = mcversion;
            // container.latest = latest;
            // container.recommended = recommended;

            state.forge[mcversion] = metadata;
        },
        liteloaderMetadata(state, metadata) {
            fitin(state.liteloader, metadata);
        },
    },
};

export default mod;
