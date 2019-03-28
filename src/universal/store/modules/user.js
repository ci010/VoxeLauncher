import {
    Auth, GameProfile, MojangAccount, ProfileService,
} from 'ts-minecraft';
import { v4 } from 'uuid';
import { requireObject, requireString } from '../helpers/validate';

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
        skin: {
            data: '',
            slim: false,
        },
        cape: '',

        id: '',
        name: '',
        accessToken: '',
        userId: '',
        userType: 'mojang',
        properties: {},

        info: {},
    },
    modules: {
        upstream: {
            namespaced: true,
            state: {
                authServices: {
                    mojang: Auth.Yggdrasil.API_MOJANG,
                },
                profileServices: {
                    mojang: ProfileService.API_MOJANG,
                },

                clientToken: v4(),
                profileMode: 'mojang',
                authMode: 'mojang',

                loginHistory: {},
            },
            mutations: {
                save(context, payload) { return context.dispatch('user/save', payload, { root: true }); },
                config(state, data) {
                    state.clientToken = data.clientToken || state.clientToken;
                    state.authMode = data.authMode || state.authMode;
                    state.profileMode = data.profileMode || state.profileMode;

                    if (typeof data.history === 'object') {
                        for (const key of Object.keys(data.loginHistory)) {
                            state.loginHistory[key] = data.loginHistory[key];
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
                
                updateHistory(state, account) {
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
                    if (context.state.authMode === 'offline') return Auth.offline(option.username);
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
                 * @param {GameProfile} selectingProfile 
                 */
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

                async setTexture(context, { data, slim }) {
                    const accessToken = context.rootState.user.accessToken;
                    const uuid = context.rootState.user.id;
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
                    }, context.state.profileServices[context.state.profileMode]).catch((e) => {
                        console.error(e);
                        throw e;
                    });
                },

            },
        },
    },
    getters: {
        history: state => state.upstream.loginHistory[state.upstream.authMode],
        logined: state => state.accessToken !== '' && state.id !== '',
        offline: state => state.upstream.authMode === 'offline',
        authModes: state => ['offline', ...Object.keys(state.upstream.authServices)],
    },
    mutations: {
        /**
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
        info(state, info) {
            state.info.id = info.id;
            state.info.email = info.email;
            state.info.username = info.username;
            state.info.registerIp = info.registerIp;
            state.info.dateOfBirth = info.dateOfBirth;
        },
        config(state, config) {
            state.id = config.id || state.id;
            state.name = config.name || state.name;
            state.accessToken = config.accessToken || state.accessToken;
            state.userId = config.userId || state.userId;
            state.properties = config.properties || state.properties;
            state.userType = config.userType || state.userType;

            // state.auth = config.auth || state.auth;
            state.skin = config.skin || state.skin;
            state.cape = config.cape || state.cape;
        },

        clear(state) {
            state.id = '';
            state.name = '';
            state.accessToken = '';
            state.userId = '';
            state.properties = {};
            state.userType = 'mojang';

            state.info = {};
            state.skin.data = '';
            state.skin.slim = false;
            state.cape = '';
        },
    },

    actions: {
        save(context) {
            const state = context.state;
            const data = JSON.stringify({
                skin: state.skin,
                cape: state.cape,
        
                id: state.id,
                name: state.name,
                accessToken: state.accessToken,
                userId: state.userId,
                userType: state.userType,
                properties: state.properties,
        
                info: state.info,

                upstream: {
                    clientToken: state.upstream.clientToken,
                    profileMode: state.upstream.profileMode,
                    authMode: state.upstream.authMode,
                    loginHistory: state.upstream.loginHistory,
                },
            }, undefined, 4);
            return context.dispatch('write', { path: 'user.json', data }, { root: true });
        },
        async load(context) {
            const data = await context.dispatch('read', { path: 'user.json', fallback: context.state, type: 'json' }, { root: true });
            context.commit('config', data);
            context.commit('upstream/config', data.upstream || {});
            await context.dispatch('refresh');
        },
        selectLoginMode(context, mode) { context.commit('upstream/authMode', mode); },
        /**
         * Logout and clear current cache.
         */
        async logout(context) {
            if (context.getters.logined) {
                await context.dispatch('upstream/invalidate', {
                    accessToken: context.state.accessToken,
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
            if (!context.getters.logined) return;
        
            const textures = await context.dispatch('upstream/getTextures', {
                id: context.state.id,
                name: context.state.name,
            });
            if (textures) context.commit('textures', textures);
        },

        async uploadSkin(context, payload) {
            requireObject(payload);
            requireString(payload.data);
            if (typeof payload.slim !== 'boolean') payload.slim = false;
            return context.dispatch('upstream/setTexture', payload);
        },

        async refreshInfo(context) {
            if (context.getters.mode === 'offline') return;
            const info = await context.dispatch('mojang/fetchUserInfo', context.state.accessToken, { root: true });
            context.commit('info', info);
        },
        /**
         * Refresh the current user login status
         */
        async refresh(context) {
            if (!context.getters.logined) return;
            if (context.getters.offline) return;

            const validate = await context.dispatch('upstream/validate', {
                accessToken: context.state.accessToken,
            });

            try {
                await context.dispatch('refreshSkin');
            } catch (e) {
                console.warn(e);
            }

            if (validate) { return; }
            try {
                const result = await context.dispatch('upstream/refresh', {
                    accessToken: context.state.accessToken,
                });
                context.commit('config', {
                    id: result.selectedProfile.id,
                    name: result.selectedProfile.name,
                    accessToken: result.accessToken,
                    userId: result.userId,
                    userType: result.userType,
                    properties: result.properties,
                });
            } catch (e) {
                context.commit('clear');
            }

            try {
                await context.dispatch('refreshInfo');
            } catch (e) {
                console.warn(e);
            }
        },

       
        /**
         * Login the user by current login mode. Refresh the skin and account information.
         */
        async login(context, payload) {
            requireObject(payload);
            requireString(payload.account);
            const loginOption = {
                username: payload.account,
                password: payload.password,
            };
            try {
                /**
                 * @type {Auth}
                 */
                const result = await context.dispatch('upstream/login', loginOption).catch((e) => {
                    if (e.message && e.message.startsWith('getaddrinfo ENOTFOUND')) {
                        const err = { message: 'error.internetNotConnected' };
                        throw err;
                    }
                    throw e;
                });
                console.log(result);
                context.commit('config', {
                    id: result.selectedProfile.id,
                    name: result.selectedProfile.name,
                    accessToken: result.accessToken,
                    userId: result.userId,
                    userType: result.userType,
                    properties: result.properties,
                });
                context.commit('upstream/updateHistory', payload.account);
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
