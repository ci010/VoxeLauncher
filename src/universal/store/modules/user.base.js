import { fitin } from '../../utils/object';

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
        },
        profileServices: {
        },

        clientToken: '',
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
        profileModes: state => Object.keys(state.profileServices),

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
            if (skin && skin.data) {
                let data;
                if (skin.data instanceof Buffer) {
                    data = skin.data.toString('base64');
                } else if (skin.data.startsWith('data:image/png;base64, ')) {
                    data = skin.data.substring('data:image/png;base64, '.length);
                }
                state.skin.data = data;
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
            fitin(state, config);
            if (typeof config.authServices === 'object') {
                state.authServices = config.authServices;
            }
            if (typeof config.profileServices === 'object') {
                state.profileServices = config.profileServices;
            }
        },
        authMode(state, mode) {
            state.authMode = mode;
            if (!state.loginHistory[mode]) {
                state.loginHistory[mode] = [];
            }
        },
        updateHistory(state, account) {
            if (!state.loginHistory[state.authMode]) state.loginHistory[state.authMode] = [];
            if (state.loginHistory[state.authMode].indexOf(account) !== -1) return;
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
};

export default mod;
