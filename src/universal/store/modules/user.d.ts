import * as vuex from "vuex";
import { Auth, GameProfile, MojangAccount, ProfileService } from 'ts-minecraft';
import { RootState } from "../store";

export declare namespace UserModule {

    interface State extends Auth {
        skin: {
            data: string,
            slim: boolean,
        },
        cape: string,

        id: string,
        name: string,
        accessToken: string,
        userId: string,
        userType: UserType,
        properties: {
            [key: string]: string,
        },

        info: MojangAccount,

        upstream: Upstream.State,
    }

    interface Dispatch {
        (type: 'selectLoginMode', mode: string): Promise<void>;

        (
            type: "login",
            payload?: { account: string; password?: string },
            options?: DispatchOptions
        ): Promise<void>;
        (type: 'logout'): Promise<void>;

        (type: 'refresh'): Promise<void>;
        (type: 'refreshInfo'): Promise<void>;
        (type: 'refreshSkin'): Promise<void>;
        
        (type: 'uploadSkin', payload: { data: string, slim: boolean }): Promise<void>
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
                mojang: Auth.Yggdrasil.API,
                [name: string]: Auth.Yggdrasil.API
            },
            profileServices: {
                mojang: ProfileService.API,
                [name: string]: ProfileService.API
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

