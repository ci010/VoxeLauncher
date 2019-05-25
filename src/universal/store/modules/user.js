import { Auth, ProfileService, MojangService } from 'ts-minecraft';
import { v4 } from 'uuid';
import { promises as fs } from 'fs';
import fileType from 'file-type';
import { requireObject, requireString } from '../../utils/object';
import base from './user.base';

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
    ...base,
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
            const data = Object.assign({}, context.state);
            return context.dispatch('setPersistence', {
                path: 'user.json',
                data,
            }, { root: true });
        },
        async load(context) {
            const data = await context.dispatch('getPersistence', { path: 'user.json' }, { root: true });

            if (typeof data === 'object') {
                const authService = data.authServices || {};
                authService.mojang = Auth.Yggdrasil.API_MOJANG;
                data.authServices = authService;

                const profileService = data.profileService || {};
                profileService.mojang = ProfileService.API_MOJANG;
                data.profileServices = profileService;

                context.commit('config', data);
                await context.dispatch('refresh');
            } else {
                context.commit('config', {
                    authServices: {
                        mojang: Auth.Yggdrasil.API_MOJANG,
                    },
                    profileServices: {
                        mojang: ProfileService.API_MOJANG,
                    },
                    clientToken: v4(),
                });
                await context.dispatch('save');
            }
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

            const { data, slim } = payload;
            let buf;
            if (typeof data === 'string') {
                buf = Buffer.from(data, 'base64');
            } else if (data instanceof Buffer) {
                buf = data;
            } else {
                throw new Error('Illegal Skin data format! Require a Buffer');
            }
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
                    data: buf,
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
                const info = await MojangService.getAccountInfo(context.state.accessToken);
                context.commit('info', info);
            } catch (e) {
                console.warn(`Cannot refresh mojang info for user ${context.state.name} (${context.state.id}).`);
                console.warn(e);
                throw e;
            }
        },

        async saveSkin(context, { skin, path }) {
            requireObject(skin);
            requireString(skin.data);
            requireString(path);
            return fs.writeFile(path, Buffer.from(skin.data, 'base64'));
        },
        async parseSkin(context, path) {
            requireString(path);
            const buf = await fs.readFile(path);
            const type = fileType(buf);
            if (type && type.ext === 'png') {
                return buf.toString('base64');
            }
            return undefined;
        },
        /**
         * Refresh the current user login status
         */
        async refresh(context) {
            if (!context.getters.logined) return;

            if (!context.getters.offline) {
                const validate = await Auth.Yggdrasil.validate({
                    accessToken: context.state.accessToken,
                }, context.getters.authService);

                if (validate) { return; }
                try {
                    const result = await Auth.Yggdrasil.refresh({
                        clientToken: context.state.clientToken,
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

                    context.dispatch('refreshInfo').catch(_ => _);
                } catch (e) {
                    context.commit('clear');
                    context.dispatch('save');
                }
            }

            context.dispatch('refreshSkin').catch(_ => _);
        },

        selectLoginMode(context, mode) {
            requireString(mode);
            if (context.state.authServices[mode] || mode === 'offline') {
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
                    : await Auth.Yggdrasil.login({
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
                console.error('Error during login.');
                console.error(e);
                throw e;
            }
        },
    },
};

export default mod;
