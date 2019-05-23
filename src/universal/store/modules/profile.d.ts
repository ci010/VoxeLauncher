import { RootState, Context, Module } from "../store";
import { GameSetting, Server, WorldInfo, Version } from "ts-minecraft";
import { Resource } from './resource';

export interface CreateOption {
    type: 'modpack' | 'server',
    java: string,
    minMemory: number,
    maxMemory: number,
    vmOptions: string[],
    mcOptions: string[],
    mcversion: string,
    name: string,
    resolution: { width: number, height: number, fullscreen: boolean },
}

export declare namespace ProfileModule {
    interface Diagnosis extends Version.Diagnosis {
        missingJava: boolean
    }

    interface Profile {
        id: string,
        name: string,

        resolution: { width: number, height: number, fullscreen: boolean },
        java: {
            path: string,
            version: string,
            majorVersion: number,
        },
        minMemory: number,
        maxMemory: number,
        vmOptions: string[],
        mcOptions: string[],

        mcversion: string,

        type: 'modpack' | 'server',

        /**
         * Server section
         */
        servers: string[],
        primary: number,

        host: string,
        port: number,
        isLanServer: boolean,
        icon: string,

        status: Server.Status,

        /**
         * Modpack section
         */

        author: string,
        description: string,
        url: string,

        showLog: boolean,
        hideLauncher: boolean,

        forge: {
            enabled: boolean,
            mods: string[],
            version: string,
        }
        liteloader: {
            enabled: boolean,
            mods: string[],
            version: string,
        }
        maps: WorldInfo[],
        optifine: {
            enabled: boolean,
            version: string,
            settings: {},
        },
        settings: GameSetting.Frame

        diagnosis: Diagnosis

        version: string
        forceVersion: boolean
        showLog: boolean
        hideLauncher: boolean
    }

    interface State {
        all: { [id: string]: Profile }
        id: string
    }

    interface Getters {
        ids: string[]
        current: Profile
    }

    interface Mutations {
        create(state: State, profile: Profile): void;
        remove(state: State, id: string): void;
        select(state: State, id: string): void;
        edit(state: State, payload: { id: string, settings: Pick<Profile, ['name', 'resolution', 'java', 'minMemory', 'maxMemory', 'mcversion']> }): void;
        gamesettings(state: State, payload: { id: string, settings: GameSetting.Frame }): void;
        diagnose(state: State, payload: { id: string, diagnosis: object, error: { id: string, autofix?: boolean, options: { id: string, autofix?: boolean }[] }[] }): void;
    }

    type C = Context<State, Getters, Mutations, Actions>
    interface Actions {
        create(context: C, option: CreateOption): Promise<string>
        createAndSelect(context: C, option: CreateOption): Promise<void>
        delete(context: C, id: string): Promise<void>
        select(context: C, id: string): Promise<void>
        export(context: C, option: { id: string, dest: string, noAsset: boolean }): Promise<void>
        import(context: C, location: string): Promise<void>
        resolveResources(context: C, id: string): { mods: Resource<any>[], resourcepacks: Resource<any>[] }
        diagnose(context: C): Promise<void>;
    }
}

export interface ProfileModule extends Module<ProfileModule.State, ProfileModule.Mutations, ProfileModule.Actions> {

}

declare const mod: ProfileModule;