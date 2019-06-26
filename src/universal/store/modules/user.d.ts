import { Auth, GameProfile, MojangAccount, ProfileService, MojangChallenge, MojangChallengeResponse } from 'ts-minecraft';
import { Context, Module } from "../store";

export declare namespace UserModule {

    type Snapshot = Partial<Omit<State, 'info'>>
    interface State {
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

        profileService: string,
        authService: string,

        loginHistory: { [mode: string]: string[] },

        clientToken: string,
    }

    interface Mutations {
        userSnapshot(state: State, snapshot: Snapshot): void;

        login(state: State, info: { auth: Auth, account?: string }): void;
        logout(state: State): void;
        textures(state: State, textures: GameProfile.Textures): void;
        mojangInfo(state: State, info: MojangAccount): void;
        authService(state: State, mode: string): void;
        profileService(state: State, mode: string): void;
    }
    interface Getters {
        loginHistories: string[]
        logined: boolean
        offline: boolean
        authServices: string[]
        profileServices: string[]

        isServiceCompatible: boolean
        authService: Auth.Yggdrasil.API
        profileService: ProfileService.API
    }

    type C = Context<State, Getters, Mutations, Actions>;
    interface Actions {
        selectLoginMode(context: C, mode: string): Promise<void>

        login(context: C, payload?: { account: string; password?: string }, options?: DispatchOptions): Promise<void>;
        logout(context: C): Promise<void>;

        refreshUser(context: C): Promise<void>;
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

export interface UserModule extends Module<"user", UserModule.State, UserModule.Getters, UserModule.Mutations, UserModule.Actions> {
}

declare const module: UserModule;

export default module;

