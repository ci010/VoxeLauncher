import { fitin } from 'universal/utils/object';

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

        info: null,

        // client data
        authServices: {
            mojang: {
                hostName: 'https://authserver.mojang.com',
                authenticate: '/authenticate',
                refresh: '/refresh',
                validate: '/validate',
                invalidate: '/invalidate',
                signout: '/signout',
            },
        },
        profileServices: {
            mojang: {
                publicKey: `-----BEGIN PUBLIC KEY-----
                MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAylB4B6m5lz7jwrcFz6Fd
                /fnfUhcvlxsTSn5kIK/2aGG1C3kMy4VjhwlxF6BFUSnfxhNswPjh3ZitkBxEAFY2
                5uzkJFRwHwVA9mdwjashXILtR6OqdLXXFVyUPIURLOSWqGNBtb08EN5fMnG8iFLg
                EJIBMxs9BvF3s3/FhuHyPKiVTZmXY0WY4ZyYqvoKR+XjaTRPPvBsDa4WI2u1zxXM
                eHlodT3lnCzVvyOYBLXL6CJgByuOxccJ8hnXfF9yY4F0aeL080Jz/3+EBNG8RO4B
                yhtBf4Ny8NQ6stWsjfeUIvH7bU/4zCYcYOq4WrInXHqS8qruDmIl7P5XXGcabuzQ
                stPf/h2CRAUpP/PlHXcMlvewjmGU6MfDK+lifScNYwjPxRo4nKTGFZf/0aqHCh/E
                AsQyLKrOIYRE0lDG3bzBh8ogIMLAugsAfBb6M3mqCqKaTMAf/VAjh5FFJnjS+7bE
                +bZEV0qwax1CEoPPJL1fIQjOS8zj086gjpGRCtSy9+bTPTfTR/SJ+VUB5G2IeCIt
                kNHpJX2ygojFZ9n5Fnj7R9ZnOM+L8nyIjPu3aePvtcrXlyLhH/hvOfIOjPxOlqW+
                O5QwSFP4OEcyLAUgDdUgyW36Z5mB285uKW/ighzZsOTevVUG2QwDItObIV6i8RCx
                FbN2oDHyPaO5j1tTaBNyVt8CAwEAAQ==
                -----END PUBLIC KEY-----`,
                // eslint-disable-next-line no-template-curly-in-string
                texture: 'https://api.mojang.com/user/profile/${uuid}/${type}',
                // eslint-disable-next-line no-template-curly-in-string
                profile: 'https://sessionserver.mojang.com/session/minecraft/profile/${uuid}',
                // eslint-disable-next-line no-template-curly-in-string
                profileByName: 'https://api.mojang.com/users/profiles/minecraft/${name}',
            },
        },

        clientToken: '',
        profileService: 'mojang',
        authService: 'mojang',

        loginHistory: {
            mojang: [],
        },
    },
    getters: {
        loginHistories: state => state.loginHistory[state.authService],
        logined: state => state.accessToken !== '' && state.id !== '',
        offline: state => state.authService === 'offline',
        authServices: state => ['offline', ...Object.keys(state.authServices)],
        profileServices: state => Object.keys(state.profileServices),

        isServiceCompatible: state => state.authService === state.profileService,
        authService: state => state.authServices[state.authService],
        profileService: state => state.profileServices[state.profileService],
    },
    mutations: {
        userSnapshot(state, snapshot) {
            fitin(state, snapshot);
            if (snapshot.authService) {
                state.authServices = { ...state.authServices, ...snapshot.authServices };
            }
            if (snapshot.profileServices) {
                state.profileServices = { ...state.profileServices, ...snapshot.profileServices };
            }
            if (snapshot.properties) {
                state.properties = { ...state.properties, ...snapshot.properties };
            }
        },
        textures(state, textures) {
            const skin = textures.textures.skin;
            const cape = textures.textures.cape;
            if (skin && skin.data) {
                let data;
                if (skin.data instanceof Buffer) {
                    data = skin.data.toString('base64');
                }
                if (data) {
                    state.skin.data = data;
                    state.skin.slim = skin.metadata ? skin.metadata.model === 'slim' : false;
                }
            }
            if (cape && cape.data) {
                state.cape = cape.data.toString('base64');
            }
        },
        mojangInfo(state, info) {
            state.info = { ...info };
        },
        login(state, { auth, account }) {
            state.id = auth.userId;
            state.accessToken = auth.accessToken;
            state.clientToken = auth.clientToken;
            state.userType = auth.userType;
            state.properties = auth.properties;
            state.name = auth.selectedProfile.name;
            if (account) {
                if (!state.loginHistory[state.authService]) state.loginHistory[state.authService] = [];
                if (state.loginHistory[state.authService].indexOf(account) !== -1) return;
                state.loginHistory[state.authService].push(account);
            }
        },
        authService(state, mode) {
            state.authService = mode;
            if (!state.loginHistory[mode]) {
                state.loginHistory[mode] = [];
            }
        },
        profileService(state, mode) {
            state.profileService = mode;
        },
        logout(state) {
            state.id = '';
            state.name = '';
            state.accessToken = '';
            state.userId = '';
            state.properties = {};
            state.userType = 'mojang';

            state.info = null;
            state.skin.data = '';
            state.skin.slim = false;
            state.cape = '';
        },
    },
};

export default mod;
