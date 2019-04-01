import {
    Auth, GameProfile, MojangAccount, ProfileService,
} from 'ts-minecraft';
import { v4 } from 'uuid';
import { requireObject, requireString, fitin } from '../helpers/utils';

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
        // user data

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

        // client data

        authServices: {
            mojang: Auth.Yggdrasil.API_MOJANG,
        },
        profileServices: {
            mojang: ProfileService.API_MOJANG,
        },

        clientToken: v4(),
        profileMode: 'mojang',
        authMode: 'mojang',

        loginHistory: {
            mojang: [],
        },
    },
    getters: {
        history: state => state.loginHistory[state.authMode],
        logined: state => state.accessToken !== '' && state.id !== '',
        offline: state => state.authMode === 'offline',
        authModes: state => ['offline', ...Object.keys(state.authServices)],

        isServiceCompatible: state => state.authMode === state.profileMode,
        authService: state => state.authServices[state.authMode],
        profileService: state => state.profileServices[state.profileMode],
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
            const { profileServices, authServices } = state;
            state.profileServices = undefined;
            state.authServices = undefined;
            fitin(state, config);
            state.profileServices = profileServices;
            state.authServices = authServices;
        },
        authMode(state, mode) {
            state.authMode = mode;
            if (!state.loginHistory[mode]) {
                state.loginHistory[mode] = [];
            }
        },
        updateHistory(state, account) {
            if (!state.loginHistory[state.authMode]) state.loginHistory[state.authMode] = [];
            state.loginHistory[state.authMode].push(account);
        },
        profileMode(state, mode) {
            state.profileMode = mode;
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
        $refresh: {
            root: true,
            async handler(context) {
                if (!context.getters.logined) return;
                try {
                    await context.dispatch('refreshSkin');
                } catch (e) {
                    console.warn(e);
                }
                if (context.state.authMode !== 'mojang') return;
                try {
                    await context.dispatch('refreshInfo');
                } catch (e) {
                    console.warn(e);
                }
            },
        },
        save(context) {
            const data = JSON.stringify(context.state, (key, value) => {
                if (key === 'authModes' || key === 'profileModes') return undefined;
                return value;
            }, 4);
            return context.dispatch('write', { path: 'user.json', data }, { root: true });
        },
        async load(context) {
            const data = await context.dispatch('read', { path: 'user.json', fallback: context.state, type: 'json' }, { root: true });
            context.commit('config', data);
            await context.dispatch('refresh');
        },
        /**
         * Logout and clear current cache.
         */
        async logout(context) {
            if (context.getters.logined) {
                if (context.state.authMode !== 'offline') {
                    await Auth.Yggdrasil.invalide({
                        accessToken: context.state.accessToken,
                        clientToken: context.state.clientToken,
                    }, context.getters.authService);
                }
            }
            context.commit('clear');
        },
        async refreshSkin(context) {
            if (context.state.profileMode === 'offline') return;
            if (!context.getters.logined) return;

            const { id, name } = context.state;

            try {
                let profile;
                if (context.getters.isServiceCompatible) {
                    profile = await ProfileService.fetch(id, context.getters.profileService);
                } else {
                    profile = await ProfileService.fetch(name, context.getters.profileService);
                }
                const textures = await ProfileService.getTextures(profile);
                if (textures) context.commit('textures', textures);
            } catch (e) {
                console.warn(`Cannot refresh the skin data for user ${context.state.name}(${context.state.id}).`);
                console.warn(e);
                throw e;
            }
        },

        async uploadSkin(context, payload) {
            requireObject(payload);
            requireString(payload.data);
            if (typeof payload.slim !== 'boolean') payload.slim = false;

            const { data, slim } = payload.data;

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
            }, context.getters.profileService).catch((e) => {
                console.error(e);
                throw e;
            });
        },

        async refreshInfo(context) {
            if (context.state.authMode !== 'mojang') return;
            try {
                const info = await context.dispatch('mojang/fetchUserInfo', context.state.accessToken, { root: true });
                context.commit('info', info);
            } catch (e) {
                console.warn(`Cannot refresh mojang info for user ${context.state.name} (${context.state.id}).`);
                console.warn(e);
                throw e;
            }
        },
        /**
         * Refresh the current user login status
         */
        async refresh(context) {
            if (!context.getters.logined) return;

            await context.dispatch('refreshSkin').catch(_ => _);

            if (context.getters.offline) return;

            const validate = await Auth.Yggdrasil.validate({
                accessToken: context.state.accessToken,
            }, context.getters.authService);

            if (validate) { return; }
            try {
                const result = await Auth.Yggdrasil.refresh({
                    clientToken: context.state.upstream.clientToken,
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
             
                await context.dispatch('refreshInfo').catch(_ => _);
            } catch (e) {
                context.commit('clear');
                context.dispatch('save');
            }
        },

        selectLoginMode(context, mode) {
            requireString(mode);
            if (context.state.authServices[mode]) {
                context.commit('authMode', mode);
            }
        },

        /**
         * Login the user by current login mode. Refresh the skin and account information.
         */
        async login(context, payload) {
            requireObject(payload);
            requireString(payload.account);
            try {
                /**
                 * @type {Auth}
                 */
                const result = context.state.authMode === 'offline'
                    ? Auth.offline(payload.account)
                    : Auth.Yggdrasil.login({
                        username: payload.account,
                        password: payload.password,
                        clientToken: context.state.clientToken,
                    }, context.getters.authService).catch((e) => {
                        if (e.message && e.message.startsWith('getaddrinfo ENOTFOUND')) {
                            const err = { message: 'error.internetNotConnected' };
                            throw err;
                        }
                        throw e;
                    });

                context.commit('config', {
                    id: result.selectedProfile.id,
                    name: result.selectedProfile.name,
                    accessToken: result.accessToken,
                    userId: result.userId,
                    userType: result.userType,
                    properties: result.properties,
                });
                context.commit('updateHistory', payload.account);

                await context.dispatch('refreshSkin').catch(_ => _);
                await context.dispatch('refreshInfo').catch(_ => _);
            } catch (e) {
                console.error(e);
            }
        },
    },
};

export default mod;
