import Vue from 'vue';
import { getExpectVersion } from 'universal/utils/versions';
import { fitin } from 'universal/utils/object';
import { UNKNOWN_STATUS } from 'universal/utils/server-status';

/**
 * @type {import('./profile').TemplateFunction}
 */
export function createTemplate(id, java, mcversion, type = 'modpack') {
    console.log(`Template from ${type}`);
    /**
     * @type {import('./profile').ProfileModule.ProfileBase}
     */
    const base = {
        id,

        name: '',

        resolution: { width: 800, height: 400, fullscreen: false },
        java,
        minMemory: undefined,
        maxMemory: undefined,
        vmOptions: [],
        mcOptions: [],

        mcversion,

        type,
        url: '',
        icon: '',

        showLog: false,
        hideLauncher: true,


        forge: {
            mods: [],
            version: '',
        },
        liteloader: {
            mods: [],
            version: '',
        },
        optifine: {
            version: '',
            settings: {},
        },

        settings: {},
        serverInfos: [],
        worlds: [],

        refreshing: false,
        problems: [],
    };
    if (type === 'modpack') {
        /**
        * @type {import('./profile').ProfileModule.Profile}
         */
        const modpack = {
            author: '',
            description: '',
            ...base,
            type: 'modpack',
        };
        return modpack;
    }
    /**
     * @type {import('./profile').ProfileModule.ServerProfile}
     */
    const server = {
        host: '',
        port: 0,
        ...base,
        type: 'server',
        status: UNKNOWN_STATUS,
    };
    return server;
}

/**
 * @type {import('./profile').ProfileModule}
 */
const mod = {
    state: {
        all: {},
        id: '',
    },
    getters: {
        profiles: state => Object.keys(state.all).map(k => state.all[k]),
        serverProtocolVersion: state => 338,
        selectedProfile: state => state.all[state.id],
        currentVersion: (state, getters, rootState) => {
            const current = state.all[state.id];
            const minecraft = current.mcversion;
            const forge = current.forge.version;
            const liteloader = current.liteloader.version;

            return {
                id: getExpectVersion(minecraft, forge, liteloader),
                minecraft,
                forge,
                liteloader,
                folder: getExpectVersion(minecraft, forge, liteloader),
            };
        },
    },
    mutations: {
        serverStatus(state, status) {
            const cur = state.all[state.id];
            if (cur.type === 'server') {
                cur.status = status;
            }
        },
        refreshingProfile(state, refreshing) {
            const cur = state.all[state.id];
            if (cur) {
                cur.refreshing = refreshing;
            }
        },
        addProfile(state, profile) {
            /**
             * Prevent the case that hot reload keep the vuex state
             */
            if (!state.all[profile.id]) {
                Vue.set(state.all, profile.id, profile);
            }
        },
        removeProfile(state, id) {
            Vue.delete(state.all, id);
        },
        selectProfile(state, id) {
            if (state.all[id]) {
                state.id = id;
            } else if (state.id === '') {
                state.id = Object.keys(state.all)[0];
            }
        },
        profile(state, settings) {
            const prof = state.all[state.id];

            prof.name = typeof settings.name === 'string' ? settings.name : prof.name;

            if (prof.type === 'modpack') {
                prof.author = settings.author || prof.author;
                prof.description = settings.description || prof.description;
            } else {
                prof.host = settings.host || prof.host;
                prof.port = settings.port || prof.port;
            }

            if (prof.mcversion !== settings.mcversion && settings.mcversion !== undefined) {
                prof.mcversion = settings.mcversion;
                prof.forge.version = '';
                prof.liteloader.version = '';
            }

            prof.minMemory = settings.minMemory || prof.minMemory;
            prof.maxMemory = settings.maxMemory || prof.maxMemory;
            if (settings.vmOptions && settings.vmOptions.length !== 0) {
                prof.vmOptions = Object.seal(settings.vmOptions);
            }
            if (settings.mcOptions && settings.mcOptions.length !== 0) {
                prof.mcOptions = Object.seal(settings.mcOptions);
            }
            prof.java = settings.java || prof.java;

            if (prof.java && !prof.java.path) {
                Reflect.deleteProperty(prof, 'java');
            }

            prof.type = settings.type || prof.type;
            prof.icon = settings.icon || prof.icon;

            if (settings.forge && typeof settings.forge === 'object') {
                const { mods, version } = settings.forge;
                const forge = state.all[state.id].forge;
                if (mods instanceof Array && mods.every(m => typeof m === 'string')) {
                    forge.mods = mods;
                }
                if (typeof version === 'string') {
                    forge.version = version;
                }
            }

            if (typeof settings.showLog === 'boolean') {
                prof.showLog = settings.showLog;
            }
            if (typeof settings.hideLauncher === 'boolean') {
                prof.hideLauncher = settings.hideLauncher;
            }
        },

        serverInfos(state, infos) {
            state.all[state.id].serverInfos = infos;
        },
        worlds(state, maps) {
            state.all[state.id].worlds = maps;
        },
        gamesettings(state, settings) {
            console.log(`GameSetting ${JSON.stringify(settings, null, 4)}`);
            const container = state.all[state.id].settings;
            if (settings.resourcePacks && settings.resourcePacks instanceof Array) {
                Vue.set(container, 'resourcePacks', settings.resourcePacks);
            }
            for (const [key, value] of Object.entries(settings)) {
                if (key in container) {
                    if (typeof value === typeof Reflect.get(container, key)) {
                        Vue.set(container, key, value);
                    }
                } else {
                    Vue.set(container, key, value);
                }
            }
        },
        profileProblems(state, problems) {
            state.all[state.id].problems = problems;
        },
    },
};

export default mod;
