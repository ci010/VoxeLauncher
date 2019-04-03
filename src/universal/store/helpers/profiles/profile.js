import {
    TextComponent, TextFormatting, Style, Server, NBT, 
} from 'ts-minecraft';
import protocols from 'static/protocol.json';
import modules from './modules';

const STATUS_PINGING = Object.freeze({
    version: {
        name: 'Unknown',
    },
    players: {
        max: -1,
        online: -1,
    },
    description: 'Ping...',
    favicon: '',
    ping: 0,
});

export default {
    namespaced: true,
    modules,
    state: () => ({
        id: '',
        name: '',

        resolution: { width: 800, height: 400, fullscreen: false },
        java: '',
        minMemory: 1024,
        maxMemory: 2048,
        vmOptions: [],
        mcOptions: [],

        mcversion: '',

        type: 'modpack',

        /**
         * Server section
         */
        servers: [],
        primary: -1,

        host: '',
        port: 25565,
        isLanServer: false,
        icon: '',

        status: {},

        /**
         * Modpack section
         */

        author: '',
        description: '',
        url: '',

        logWindow: false,
    }),
    getters: {
        id: state => state.id,
        name: state => state.name,
        mcversion: state => state.mcversion || '',
        java: state => state.java,
        maxMemory: state => state.maxMemory,
        minMemory: state => state.minMemory,
        vmOptions: state => state.vmOptions,
        mcOptions: state => state.mcOptions,
        resolution: state => state.resolution,

        author: state => state.author,
        description: state => state.description,
        logWindow: state => state.logWindow,

        type: state => state.type,

        host: state => state.host,
        port: state => state.port,
        icon: state => state.icon,
        status: state => state.status,
        servers: state => state.servers,
        expectedVersions: (state) => {
            if (state.status && state.status.version) {
                const protocol = state.status.version.protocol;
                const target = protocols[protocol];
                if (target) return target;
            }
            return [];
        },

        error(state, getters, rootState, rootGetters) {
            const errors = [];
            if (!state.name) errors.push('error.missingName');
            if (!state.java) errors.push('error.missingJava');
            if (!state.mcversion) errors.push('error.missingMinecraft');
            if (state.type === 'modpack') {
                if (!state.author) errors.push('modpack.error.author');
                if (!state.description) errors.push('modpack.error.description');
            } else {
                if (!state.host) errors.push('server.error.missingHost');
                if (!state.port) errors.push('server.error.missingPort');
                if (state.status) {
                    if (getters.expectedVersions.indexOf(state.mcversion) === -1) {
                        errors.push('server.error.wrongVersion');
                    }
                }
            }
            return errors;
        },
    },
    mutations: {
        edit(state, option) {
            Object.keys(option)
                .forEach((key) => { state[key] = option[key]; });
        },
    },
    actions: {
        async load(context) {
            const path = `profiles/${context.state.id}/profile.json`;
            const data = await context.dispatch('read', { path, fallback: {}, type: 'json' }, { root: true });
            context.commit('edit', data);
            for (const m of Object.keys(modules)) {
                if (modules[m].namespaced) await context.dispatch(`${m}/load`, { id: context.state.id });
            }
        },
        save(context) {
            const path = `profiles/${context.state.id}/profile.json`;
            const data = JSON.stringify(context.state, (key, value) => {
                if (modules[key]) return undefined;
                return value;
            });
            return context.dispatch('write', { path, data }, { root: true });
        },
        edit(context, option) {
            const keys = Object.keys(option);
            if (keys.length === 0) return;
            const profile = {};
            for (const key of keys) {
                if (context.state[key] !== undefined) {
                    if (context.state[key] !== option[key]) {
                        if (key === 'mcversion') {
                            context.dispatch('forge/setVersion', '');
                            context.dispatch('liteloader/setVersion', '');
                        }
                        profile[key] = option[key];
                    }
                }
            }
            if (Object.keys(profile) !== 0) context.commit('edit', profile);
        },

        refresh(context) {
            if (context.state.type !== 'server') return undefined;
            context.commit('edit', { status: STATUS_PINGING });
            if (context.state.host === undefined) return Promise.reject('server.host.empty');
            return Server.fetchStatusFrame({
                host: context.state.host,
                port: context.state.port,
            }, { protocol: 335 })
                .then((frame) => {
                    const all = {
                        icon: frame.favicon,
                        status: frame,
                    };
                    context.commit('edit', all);
                }, (err) => {
                    if (err) {
                        console.error(err);
                        if (err.code === 'ETIMEOUT') {
                            context.commit('edit', {
                                status: {
                                    version: {
                                        name: 'unknown',
                                    },
                                    players: {
                                        max: -1,
                                        online: -1,
                                    },
                                    description: 'server.status.timeout',
                                    favicon: '',
                                    ping: 0,
                                },
                            });
                        } else if (err.code === 'ENOTFOUND') {
                            context.commit('edit', {
                                status: {
                                    version: {
                                        name: 'unknown',
                                    },
                                    players: {
                                        max: -1,
                                        online: -1,
                                    },
                                    description: 'server.status.nohost',
                                    favicon: '',
                                    ping: 0,
                                },
                            });
                        } else if (err.code === 'ECONNREFUSED') {
                            context.commit('edit', {
                                status: {
                                    version: {
                                        name: 'unknown',
                                    },
                                    players: {
                                        max: -1,
                                        online: -1,
                                    },
                                    description: 'server.status.refuse',
                                    favicon: '',
                                    ping: 0,
                                },
                            });
                        }
                    } else {
                        context.commit('edit', {
                            status: {
                                version: {
                                    name: 'Unknown',
                                },
                                players: {
                                    max: -1,
                                    online: -1,
                                },
                                description: 'server.status.ping',
                                favicon: '',
                                ping: 0,
                            },
                        });
                    }
                });
        },
        $refresh: {
            root: true,
            /**
             * 
             * @param {vuex.ActionContext} context 
             * @param {*} force 
             */
            handler(context, force) {
                if (context.state.type !== 'server') return undefined;
                return context.dispatch('refresh', force);
            },
        },
    },
};
