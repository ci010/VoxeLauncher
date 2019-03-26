import { FullModule } from "vuex";
import { RootState } from "../store";
import { GameSetting, Server, WorldInfo } from "ts-minecraft";

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
    interface Profile {
        id: string,
        name: string,

        resolution: { width: number, height: number, fullscreen: boolean },
        java: string,
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

        logWindow: boolean,

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
    }

    interface State {
        all: Profile[]
        id: number
    }

    interface Getter extends Profile {
        ids: string[]
        current: Profile
    }

    interface Commit {
        (type: 'create', profile: Profile): void;
        (type: 'delete', id: string): void;

        /**
         * Edit current profile
         */
        (type: 'edit', payload: object): void;

        (type: 'enableForge'): void;
        (type: 'addForgeMod'): void;

        (type: 'enableLiteloader'): void;
        (type: 'addLiteloaderMod'): void;
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
    }
}

export interface ProfileModule extends FullModule<ProfileModule.State, RootState, {}, ProfileModule.Commit, ProfileModule.Dispatch> {

}

declare const mod: ProfileModule;