import * as vuex from "vuex";
import { Auth, GameProfile, MojangAccount, ProfileService } from 'ts-minecraft';
import { RootState } from "../store";

export declare namespace UserModule {
    interface State {
        skin: {
            data: string,
            slim: boolean,
        },
        cape: string,

        info: MojangAccount,
        auth: Auth,
    }

    interface Dispatch {
        (type: 'login' | 'refresh' | 'logout', payload?: any): Promise<void>;
    }

    interface Commit {
        (type: 'textures', textures: GameProfile.Textures): void;
        (type: 'info', info: MojangAccount): void;
        (type: 'config', config: any): void;
        (type: 'login', auth: Auth): void;
        (type: 'clear'): void;
    }

    namespace Upstream {
        interface State {
            authServices: {
                mojang: string,
                offline: {},
            },
            profileServices: {
                mojang: string,
            },

            profileMode: string,
            authMode: string,

            loginHistory: { [mode: string]: string[] },

            clientToken: string,
        }
    }
}

export interface UserModule extends vuex.FullModule<UserModule.State, RootState, never, UserModule.Commit, UserModule.Dispatch> {
    modules: {
        upstream: vuex.Module<UserModule.Upstream.State, any>
    },
}

declare const module: UserModule;

export default module;

