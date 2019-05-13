import { FullModule } from "vuex";
import { RootState } from "../store";
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
    }

    interface State {
        all: { [id: string]: Profile }
        id: string
    }

    interface Getters {
        ids: string[]
        current: Profile
    }

    interface Commit {
        (type: 'create', profile: Profile): void;
        (type: 'delete', id: string): void;

        /**
         * Edit current profile
         */
        (type: 'edit', payload: { id: string, settings: Pick<Profile, ['name', 'resolution', 'java', 'minMemory', 'maxMemory', 'mcversion']> }): void;
        (type: 'gamesettings', payload: { id: string, settings: GameSetting.Frame }): void;

        (type: 'enableForge'): void;
        (type: 'addForgeMod'): void;

        (type: 'enableLiteloader'): void;
        (type: 'addLiteloaderMod'): void;

        (type: 'diagnose', payload: { id: string, diagnosis: object, error: { id: string, autofix?: boolean, options: { id: string, autofix?: boolean }[] }[] }): void;
    }

    interface Dispatch {
        (type: 'create', option: CreateOption): Promise<string>
        (type: 'delete', id: string): Promise<void>
        (type: 'select', id: string): Promise<void>
        (type: 'edit', payload: { id: string }): Promise<void>

        (type: 'enableForge'): Promise<void>;
        (type: 'addForgeMod'): Promise<void>;
        (type: 'delForgeMod'): Promise<void>;

        (type: 'enableLiteloader'): Promise<void>;
        (type: 'addLiteloaderMod'): Promise<void>;
        (type: 'delLiteloaderMod'): Promise<void>;

        (type: 'diagnose'): Promise<void>;
        (type: 'resolveResources', id: string): { mods: Resource<any>[], resourcepacks: Resource<any>[] }
    }
}

export interface ProfileModule extends FullModule<ProfileModule.State, RootState, ProfileModule.Getters, ProfileModule.Commit, ProfileModule.Dispatch> {

}

declare const mod: ProfileModule;