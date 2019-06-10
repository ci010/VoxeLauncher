import { RootState, Context, Module } from "../store";
import { GameSetting, Server, WorldInfo, Version, World, LevelDataFrame } from "ts-minecraft";
import { Resource } from './resource';
import { VersionModule } from "./version";

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
    interface Problem {
        id: string,
        arguments?: { [key: string]: any },
        autofix?: boolean,
        optional?: boolean,
    }
    interface ServerState extends Server.Info {
        status?: Server.Status,
    }


    interface Profile {
        id: string;
        name: string;

        resolution: { width: number, height: number, fullscreen: boolean };
        java: {
            path: string;
            version: string;
            majorVersion: number;
        },
        minMemory: number;
        maxMemory: number;
        vmOptions: string[];
        mcOptions: string[];

        mcversion: string;

        type: 'modpack' | 'server';


        author: string;
        description: string;
        url: string;

        showLog: boolean;
        hideLauncher: boolean;

        showLog: boolean;
        hideLauncher: boolean;

        forge: {
            mods: string[],
            version: string,
        };
        liteloader: {
            mods: string[],
            version: string,
        };
        optifine: {
            version: string,
            settings: {},
        };

        server: ServerState;
        // caches
        maps: WorldInfo[];
        settings: GameSetting.Frame;
        refreshing: boolean,
        problems: Problem[];
    }

    interface State {
        all: { [id: string]: Profile }
        id: string
    }

    interface Getters {
        profiles: Profile[]
        selectedProfile: Profile
        currentVersion: VersionModule.LocalVersion
    }

    interface Mutations {
        addProfile(state: State, profile: Profile): void;
        removeProfile(state: State, id: string): void;
        selectProfile(state: State, id: string): void;

        profile(state: State, payload: Partial<Profile>): void;

        profileProblems(state: State, problems: Problem[]): void;
        levelData(state: State, maps: LevelDataFrame[]): void;
        gamesettings(state: State, payload: { id: string, settings: GameSetting.Frame }): void;
        refreshingProfile(state: State, refreshing: boolean): void;
    }

    type C = Context<State, Getters, Mutations, Actions>
    interface Actions {
        loadProfile(context: C, id: string): Promise<void>
        createProfile(context: C, option: Partial<CreateOption>): Promise<string>
        createAndSelectProfile(context: C, option: Partial<CreateOption>): Promise<void>
        editProfile(context: C, payload: Partial<Profile>): Promise<void>;
        deleteProfile(context: C, id: string): Promise<void>
        exportProfile(context: C, option: { id: string, dest: string, noAssets?: boolean }): Promise<void>
        importProfile(context: C, location: string): Promise<void>
        resolveProfileResources(context: C, id: string): { mods: Resource<any>[], resourcepacks: Resource<any>[] }
        fixProfile(context: C, problems: Problem[]): Promise<void>
        diagnoseProfile(context: C): Promise<Problem[]>;
    }
}

export interface ProfileModule extends Module<ProfileModule.State, ProfileModule.Getters, ProfileModule.Mutations, ProfileModule.Actions> {
}

declare const mod: ProfileModule;