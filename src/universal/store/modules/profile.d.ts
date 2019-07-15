import { GameSetting, LevelDataFrame, World, Server } from "ts-minecraft";
import { Context, Module } from "../store";
import { JavaModule } from "./java";
import { Resource } from './resource';
import { DiagnoseModule } from './diagnose';
import { VersionModule } from "./version";

type Problem = DiagnoseModule.Problem;

type CreateProfileOption = Omit<ProfileModule.Profile, 'serverInfos' | 'maps' | 'settings' | 'refreshing' | 'problems' | 'id'> & { type: 'modpack' }
type CreateServerProfileOption = Omit<ProfileModule.ServerProfile, 'serverInfos' | 'maps' | 'settings' | 'refreshing' | 'problems' | 'id'> & { type: 'server' }
type CreateOption = DeepPartial<CreateProfileOption | CreateServerProfileOption>;

// From https://github.com/andnp/SimplyTyped/blob/master/src/types/objects.ts
type DeepPartial<T> = Partial<{
    [k in keyof T]:
    T[k] extends unknown[] ? Array<DeepPartial<T[k][number]>> :
    T[k] extends Function ? T[k] :
    T[k] extends object ? DeepPartial<T[k]> :
    T[k];
}>;
export interface TemplateFunction {
    (id: string, java: JavaModule.Java, mcversion: string, type: 'modpack' | 'server'): ProfileModule.ServerOrModpack
}
export const createTemplate: TemplateFunction;
export declare namespace ProfileModule {
    interface ServerProfile extends ProfileBase {
        type: 'server';
        host: string;
        port: number;

        // cache
        status: Server.StatusFrame;
    }

    interface Profile extends ProfileBase {
        type: 'modpack';
        author: string;
        description: string;
    }

    type ServerOrModpack = Profile | ServerProfile;
    type ServerAndModpack = Profile & ServerProfile;

    type LevelOnlyWorld = Pick<World, 'level' | 'path'>

    interface ProfileBase {
        /**
         * The unique id (uuid) of the profile. The profile data will be stored into profiles/${id}/profile.json according to this.
         */
        id: string;
        /**
         * The display name of the profile. It will also be the modpack display name
         */
        name: string;

        resolution: { width: number, height: number, fullscreen: boolean };
        java: {
            path: string;
            version: string;
            majorVersion: number;
        },
        minMemory?: number;
        maxMemory?: number;
        vmOptions: string[];
        mcOptions: string[];

        mcversion: string;

        /**
         * Either a modpack or server. The modpack is the common profile. It can export into a modpack 
         */
        type: 'modpack' | 'server';

        url: string;
        icon: string;

        /**
         * Should show a logger window after Minecraft launched
         */
        showLog: boolean;
        /**
         * Should launcher hide after Minecraft launched
         */
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

        // caches
        serverInfos: Server.Info[];
        worlds: LevelOnlyWorld[];
        settings: GameSetting.Frame;
        refreshing: boolean,
        problems: Problem[];
    }

    interface State {
        all: { [id: string]: ServerOrModpack }
        id: string
    }

    interface Getters {
        profiles: ServerOrModpack[]
        serverProtocolVersion: number
        selectedProfile: ServerOrModpack
        currentVersion: VersionModule.ResolvedVersion
    }

    interface Mutations {
        addProfile(state: State, profile: ProfileBase): void;
        removeProfile(state: State, id: string): void;
        selectProfile(state: State, id: string): void;

        /**
         * Edit the profile content. This commit will trigger save function to store the data to the disk.
         * Don't use this directly. Use `editProfile` action
         * @param payload The modified data
         */
        profile(state: State, payload: Partial<ServerAndModpack>): void;

        // non-persistence mutation below, just update cache, nothing saved

        profileProblems(state: State, problems: Problem[]): void;
        serverStatus(state: State, status: Server.StatusFrame): void;
        worlds(state: State, worlds: LevelOnlyWorld[]): void;
        serverInfos(state: State, infos: Server.Info[]): void;
        gamesettings(state: State, payload: GameSetting.Frame): void;
        refreshingProfile(state: State, refreshing: boolean): void;
    }

    type C = Context<State, Getters, Mutations, Actions>
    interface Actions {
        loadProfile(context: C, id: string): Promise<void>

        createProfile(context: C, option: CreateOption): Promise<string>
        createAndSelectProfile(context: C, option: CreateOption): Promise<void>
        editProfile(context: C, payload: Partial<ServerAndModpack>): Promise<void>;
        deleteProfile(context: C, id: string): Promise<void>

        exportProfile(context: C, option: { id: string, dest: string, noAssets?: boolean }): Promise<void>
        importProfile(context: C, location: string): Promise<void>
        resolveProfileResources(context: C, id: string): { mods: Resource<any>[], resourcepacks: Resource<any>[] }

        pingServer(context: C, payload: { host: string, port: number, protocol: number }): Promise<Server.StatusFrame>

        importMap(context: C, path: string): Promise<void>
        deleteMap(context: C, name: string): Promise<void>
        exportMap(context: C, payload: { name: string, destination: string, zip?: boolean }): Promise<void>

        pingServers(context: C): Promise<(Server.Info & { status: Server.StatusFrame })[]>
        refreshProfile(context: C): Promise<void>
        createProfileFromServer(context: C, info: Server.Info & { status: Server.StatusFrame }): Promise<string>
    }
}

export interface ProfileModule extends Module<"profile", ProfileModule.State, ProfileModule.Getters, ProfileModule.Mutations, ProfileModule.Actions> {
}

declare const mod: ProfileModule;