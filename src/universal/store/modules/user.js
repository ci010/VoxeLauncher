import {
    Auth, GameProfile, MojangAccount, ProfileService,
} from 'ts-minecraft';
import { v4 } from 'uuid';

/**
 * The possible ways for user auth and profile:
 * 
 * 1. By uuid
 * user login, use the the uuid from auth info to fetch game profile and get the skin;
 * this method usually requires the auth service and profile service is the same provider
 * 
 * 2. By username
 * user login, and then use the username from auth info to fetch game profile and get the skin;
 * in this method, user could have different auth and profile services 
 * 
 * Module Requirement:
 * 
 * login, by user name and password
 * selectLoginMode, select the loginMode
 * 
 * getGameProfile, get profile by user uuid or user name
 * selectGameProfileService, select the profile service 
 * 
 * @type import('./user').UserModule
 */
const mod = {
    namespaced: true,
    state: {
        auth: Auth.offline('Steve'),
        skin: {
            data: '',
            slim: false,
        },
        cape: '',
        info: {},
    },
    modules: {
        upstream: {
            namespaced: true,
            state: {
                authServices: {
                    mojang: Auth.Yggdrasil.API_MOJANG,
                    offline: {},
                },
                profileServices: {
                    mojang: ProfileService.API_MOJANG,
                },

                profileMode: 'mojang',
                authMode: 'mojang',

                loginHistory: {},

                clientToken: v4(),
            },
            mutations: {
                save(context, payload) { return context.dispatch('user/save', payload, { root: true }); },
                config(state, data) {
                    state.clientToken = data.clientToken || state.clientToken;
                    state.authMode = data.authMode || state.authMode;
                    state.profileMode = data.profileMode || state.profileMode;

                    if (typeof data.history === 'object') {
                        for (const key of Object.keys(data.history)) {
                            state.loginHistory[key] = data.history[key];
                        }
                    }

                    if (!state.loginHistory[state.authMode]) {
                        state.loginHistory[state.authMode] = [];
                    }

                    if (typeof data.authServices === 'object') {
                        for (const mode of Object.keys(data.authServices)) {
                            if (!state.authServices[mode]) {
                                state.authServices[mode] = data.authServices[mode];
                            }
                        }
                    }

                    if (typeof data.profileServices === 'object') {
                        for (const mode of Object.keys(data.profileServices)) {
                            if (!state.profileServices[mode]) {
                                state.profileServices[mode] = data.profileServices[mode];
                            }
                        }
                    }
                },
                authMode(state, mode) {
                    state.authMode = mode;
                    if (!state.loginHistory[mode]) {
                        state.loginHistory[mode] = [];
                    }
                },
                profileMode(state, mode) {
                    state.profileMode = mode;
                },
                login(state, account) {
                    if (!state.loginHistory[state.authMode]) state.loginHistory[state.authMode] = [];
                    state.loginHistory[state.authMode].push(account);
                },
            },
            getters: {
                isServiceCompatible(state) { return state.authMode === state.profileMode; },
                offline(state) { return state.authMode === 'offline'; },
                authService(state) { return state.authServices[state.authMode]; },
                profileService(state) { return state.profileServices[state.profileMode]; },
            },
            actions: {
                login(context, option) {
                    if (context.state.authMode === 'offline') return Auth.offline(option);
                    return Auth.Yggdrasil.login({ ...option, clientToken: context.state.clientToken }, context.getters.authService);
                },
                refresh(context, option) {
                    if (context.state.authMode === 'offline') return Promise.resolve();
                    return Auth.Yggdrasil.refresh(option, context.getters.authService);
                },
                validate(context, option) {
                    if (context.state.authMode === 'offline') return true;
                    return Auth.Yggdrasil.validate(option, context.getters.authService);
                },
                invalidate(context, option) {
                    if (context.state.authMode === 'offline') return Promise.resolve();
                    return Auth.Yggdrasil.invalide(option, context.getters.authService);
                },
                signout(context, option) {
                    if (context.state.authMode === 'offline') return Promise.resolve();
                    return Auth.Yggdrasil.signout(option, context.getters.authService);
                },
                /**
                 * @param {GameProfile} gameProfile 
                 */
                fetch(context, gameProfile) {
                    if (context.getters.isServiceCompatible) {
                        return ProfileService.fetch(gameProfile.id, context.getters.profileService);
                    }
                    return ProfileService.fetch(gameProfile.name, context.getters.profileService);
                },
                async setTexture(context, { data, slim }) {
                    const accessToken = context.rootState.user.auth.accessToken;
                    const uuid = context.rootState.user.auth.selectedProfile.id;
                    return ProfileService.setTexture({
                        uuid,
                        accessToken,
                        type: 'skin',
                        texture: {
                            metadata: {
                                model: slim ? 'slim' : 'steve',
                            },
                            data,
                            url: '',
                        },
                    }, context.state.api).catch((e) => {
                        console.error(e);
                        throw e;
                    });
                },
                async getTextures(context, selectingProfile) {
                    let profile;
                    if (context.getters.isServiceCompatible) {
                        profile = await ProfileService.fetch(selectingProfile.id, context.getters.profileService);
                    } else {
                        profile = await ProfileService.fetch(selectingProfile.name, context.getters.profileService);
                    }
                    if (!profile) throw new Error('Profile cannot be undefined');
                    return ProfileService.getTextures(profile);
                },
            },
        },
    },
    getters: {
        modes: state => Object.keys(state.upstream.authServices),
        mode: state => state.upstream.authMode,
        history: state => state.upstream.loginHistory[state.upstream.authMode],

        username: state => (state.auth.selectedProfile ? state.auth.selectedProfile.name : ''),
        id: state => (state.auth.selectedProfile.id ? state.auth.selectedProfile.id : ''),
        logined: state => typeof state.auth === 'object' && Object.keys(state.auth).length !== 0,
    },
    mutations: {
        /**
         * 
         * @param {UserState} state 
         * @param {GameProfile.Textures} textures 
         */
        textures(state, textures) {
            const skin = textures.textures.skin;
            const cape = textures.textures.cape;
            if (skin) {
                state.skin.data = skin.data;
                state.skin.slim = skin.metadata ? skin.metadata.model === 'slim' : false;
            }
            if (cape) {
                state.cape = cape.data;
            }
        },
        /**
         * 
         * @param {MojangAccount} info 
         */
        info(state, info) {
            state.info.id = info.id;
            state.info.email = info.email;
            state.info.username = info.username;
            state.info.registerIp = info.registerIp;
            state.info.dateOfBirth = info.dateOfBirth;
        },
        config(state, config) {
            state.auth = config.auth || state.auth;
            state.skin = config.skin || state.skin;
            state.cape = config.cape || state.cape;
        },

        login(state, auth) {
            state.auth = Object.assign({}, auth);
        },
        clear(state) { state.auth.selectedProfile.id = ''; },
    },

    actions: {
        save(context) {
            const data = JSON.stringify({
                auth: context.state.auth,
                skin: context.state.skin,
                cape: context.state.cape,

                clientToken: context.state.upstream.clientToken,
                history: context.state.upstream.loginHistory,
                authMode: context.state.upstream.authMode,
                profileMode: context.state.upstream.profileMode,
            });
            return context.dispatch('write', { path: 'auth.json', data }, { root: true });
        },
        async load(context) {
            const data = await context.dispatch('read', { path: 'auth.json', fallback: {}, type: 'json' }, { root: true });
            context.commit('config', data);
            context.commit('upstream/config', data);
            await context.dispatch('refresh');
        },
        selectLoginMode(context, mode) { context.commit('upstream/mode', mode); },
        /**
         * Logout and clear current cache.
         */
        async logout(context) {
            if (context.getters.logined) {
                await context.dispatch('upstream/invalide', {
                    accessToken: context.state.auth.accessToken,
                });
            }
            context.commit('clear');
        },
        $refresh: {
            root: true,
            async handler(context) {
                try {
                    await context.dispatch('refreshSkin');
                } catch (e) {
                    console.warn(e);
                }
                try {
                    await context.dispatch('refreshInfo');
                } catch (e) {
                    console.warn(e);
                }
            },
        },
        async refreshSkin(context) {
            if (context.getters.mode === 'offline') return;
            if (context.state.auth.selectedProfile === undefined || !context.state.auth.selectedProfile.id) return;
            const gameProfile = await context.dispatch('upstream/fetch', {
                uuid: context.state.auth.selectedProfile.id,
                cache: true,
            });
            const textures = await context.dispatch('upstream/getTextures', gameProfile);
            if (textures) context.commit('textures', textures);
        },
        async refreshInfo(context) {
            if (context.getters.mode === 'offline') return;
            const info = await context.dispatch('mojang/fetchUserInfo', context.state.auth.accessToken, { root: true });
            context.commit('info', info);
        },
        /**
         * Refresh the current user login status
         */
        async refresh(context) {
            if (!context.getters.logined) return;

            const validate = await context.dispatch('upstream/validate', {
                accessToken: context.state.auth.accessToken,
            });

            try {
                await context.dispatch('refreshSkin');
            } catch (e) {
                console.warn(e);
            }

            if (validate) { return; }
            try {
                const auth = await context.dispatch('upstream/refresh', {
                    accessToken: context.state.auth.accessToken,
                });
                context.commit('login', auth);
            } catch (e) {
                context.commit('clear');
            }

            try {
                await context.dispatch('refreshInfo');
            } catch (e) {
                console.warn(e);
            }
        },

        async uploadTexture(context, payload) {
            return context.dispatch('upstream/setTexture', payload);
        },
        /**
         * Login the user by current login mode. Refresh the skin and account information.
         */
        async login(context, payload) {
            const loginOption = {
                username: payload.account,
                password: payload.password,
            };
            try {
                const result = await context.dispatch('upstream/login', loginOption).catch((e) => {
                    if (e.message && e.message.startsWith('getaddrinfo ENOTFOUND')) {
                        const err = { message: 'error.internetNotConnected' };
                        throw err;
                    }
                    throw e;
                });
                if (!result) throw new Error(`Cannot auth the ${payload.account}`);
                context.commit('login', result);
                try {
                    await context.dispatch('refreshSkin');
                } catch (e) {
                    console.warn(e);
                }
                try {
                    await context.dispatch('refreshInfo');
                } catch (e) {
                    console.warn(e);
                }
            } catch (e) {
                console.error(e);
            }
        },
    },
};

export default mod;
