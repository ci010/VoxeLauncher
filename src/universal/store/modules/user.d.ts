import { Auth, GameProfile, MojangAccount, ProfileService, MojangChallenge, MojangChallengeResponse } from 'ts-minecraft';
import { Context, Module } from "../store";

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

        info: MojangAccount?,

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

    interface Mutations {
        textures(state: State, textures: GameProfile.Textures): void;
        info(state: State, info: MojangAccount): void;
        config(state: State, config: any): void;
        authMode(state: State, mode: string): void;
        updateHistory(state: State, account: string): void;
        profileMode(state: State, mode: string): void;
        clear(state: State): void;
    }
    interface Getters {
        history: string[]
        logined: boolean
        offline: boolean
        authModes: string[]
        profileModes: string[]

        isServiceCompatible: boolean
        authService: Auth.Yggdrasil.API
        profileService: ProfileService.API
    }

    type C = Context<State, Getters, Mutations, Actions>;
    interface Actions {
        save(context: C): Promise<void>
        load(context: C): Promise<void>
        selectLoginMode(context: C, mode: string): Promise<void>

        login(
            context: C,
            payload?: { account: string; password?: string },
            options?: DispatchOptions
        ): Promise<void>;
        logout(context: C): Promise<void>;

        refresh(context: C): Promise<void>;
        refreshInfo(context: C): Promise<void>;
        refreshSkin(context: C): Promise<void>;

        checkLocation(context: C): Promise<boolean>;
        getChallenges(context: C): Promise<MojangChallenge[]>;
        submitChallenges(context: C, responses: MojangChallengeResponse[]): Promise<any>;

        uploadSkin(context: C, payload: { data: string | Buffer, slim: boolean }): Promise<void>
        saveSkin(context: C, payload: { skin: { data: string }, path: string }): Promise<void>;
        parseSkin(context: C, path: string): Promise<string | undefined>;
    }
}

export interface UserModule extends Module<UserModule.State, UserModule.Getters, UserModule.Mutations, UserModule.Actions> {
}

declare const module: UserModule;

export default module;

