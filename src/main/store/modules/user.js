import fileType from 'file-type';
import { promises as fs } from 'fs';
import { parse as parseUrl } from 'url';
import { Auth, MojangService, ProfileService } from 'ts-minecraft';
import { v4 } from 'uuid';
import got from 'got';
import { requireObject, requireString } from 'universal/utils/object';
import base from 'universal/store/modules/user';

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
 * @type {import('universal/store/modules/user').UserModule}
 */
const mod = {
    ...base,
    actions: {
        async save(context, { mutation }) {
            switch (mutation) {
                case 'login':
                case 'logout':
                case 'textures':
                case 'authService':
                case 'profileService':
                    await context.dispatch('setPersistence', {
                        path: 'user.json',
                        data: Object.assign({}, context.state),
                    });
                    break;
                default:
            }
        },
        async load(context) {
            const data = await context.dispatch('getPersistence', { path: 'user.json' });

            if (typeof data === 'object') {
                const authService = typeof data.authServices === 'object' ? data.authServices : {};
                authService.mojang = Auth.Yggdrasil.API_MOJANG;
                data.authServices = authService;

                const profileServices = typeof data.profileServices === 'object' ? data.profileServices : {};
                profileServices.mojang = ProfileService.API_MOJANG;
                data.profileServices = profileServices;
                context.commit('userSnapshot', data);
            } else {
                context.commit('userSnapshot', {
                    authServices: {
                        mojang: Auth.Yggdrasil.API_MOJANG,
                    },
                    profileServices: {
                        mojang: ProfileService.API_MOJANG,
                    },
                    clientToken: v4(),
                });
            }
        },
        async init(context) {
            if (!context.getters.offline) {
                context.dispatch('refreshUser');
            }
        },
        /**
         * Logout and clear current cache.
         */
        async logout(context) {
            if (context.getters.logined) {
                if (context.state.authService !== 'offline') {
                    await Auth.Yggdrasil.invalide({
                        accessToken: context.state.accessToken,
                        clientToken: context.state.clientToken,
                    }, context.getters.authService);
                }
            }
            context.commit('logout');
        },

        async checkLocation(context) {
            if (!context.getters.logined) return true;
            if (context.state.authService !== 'mojang') {
                return true;
            }
            try {
                const result = await MojangService.checkLocation(context.state.accessToken);
                return result;
            } catch (e) {
                if (e.error === 'ForbiddenOperationException' && e.errorMessage === 'Current IP is not secured') {
                    return false;
                }
                throw e;
            }
        },

        async getChallenges(context) {
            if (!context.getters.logined) return [];
            if (context.state.profileService !== 'mojang') return [];

            return MojangService.getChallenges(context.state.accessToken);
        },

        submitChallenges(context, responses) {
            if (!context.getters.logined) throw new Error('Cannot submit challenge if not logined');
            if (context.state.profileService !== 'mojang') throw new Error('Cannot sumit challenge if login mode is not mojang!');
            if (!(responses instanceof Array)) throw new Error('Expect responses Array!');
            return MojangService.responseChallenges(context.state.accessToken, responses);
        },

        async refreshSkin(context) {
            if (context.state.profileService === 'offline') return;
            if (context.state.name === '') return;
            if (!context.getters.logined) return;

            const { id, name } = context.state;

            try {
                let profile;
                if (context.getters.isServiceCompatible) {
                    profile = await ProfileService.fetch(id, { api: context.getters.profileService });
                } else {
                    profile = await ProfileService.lookup(name, { api: context.getters.profileService });
                    profile = await ProfileService.fetch(profile.id, { api: context.getters.profileService });
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
            if (context.state.authService !== 'mojang') return;
            try {
                const info = await MojangService.getAccountInfo(context.state.accessToken);
                context.commit('mojangInfo', info);
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

            const url = parseUrl(path);

            let buf;
            switch (url.protocol) {
                case 'http:':
                case 'https:':
                    buf = await got.get(path, { encoding: null }).then(r => r.body);
                    break;
                default:
                    buf = await fs.readFile(path);
            }
            const type = fileType(buf);
            if (type && type.ext === 'png') {
                return buf.toString('base64');
            }
            return undefined;
        },
        /**
         * Refresh the current user login status
         */
        async refreshUser(context) {
            if (!context.getters.logined) return;

            if (!context.getters.offline) {
                const validate = await Auth.Yggdrasil.validate({
                    accessToken: context.state.accessToken,
                }, context.getters.authService);

                if (validate) {
                    context.dispatch('checkLocation');
                    return;
                }
                try {
                    const result = await Auth.Yggdrasil.refresh({
                        clientToken: context.state.clientToken,
                        accessToken: context.state.accessToken,
                    });
                    context.commit('login', { auth: result });
                    context.dispatch('checkLocation');
                    context.dispatch('refreshInfo').catch(_ => _);
                } catch (e) {
                    context.commit('logout');
                }
            }

            context.dispatch('refreshSkin').catch(_ => _);
        },


        async selectLoginMode(context, mode) {
            requireString(mode);
            if (context.state.authServices[mode] || mode === 'offline') {
                context.commit('authService', mode);
            }
        },

        /**
         * Login the user by current login mode. Refresh the skin and account information.
         */
        async login(context, payload) {
            if (!payload) throw new Error();
            requireObject(payload);
            requireString(payload.account);

            try {
                /**
                 * @type {Auth}
                 */
                const result = context.state.authService === 'offline'
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

                context.commit('login', {
                    auth: result,
                    account: payload.account,
                });
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
