import { Store, DispatchOptions, MutationTree, ActionTree, Module as VModule, Action } from 'vuex'
import { GameProfile, MojangAccount, VersionMeta, Forge, LiteLoader, GameSetting, ForgeWebPage, MojangChallengeResponse, MojangChallenge } from 'ts-minecraft';
import { RendererInterface } from 'electron';
import { Task } from 'treelike-task';

import { UserModule } from './modules/user'
import { VersionModule, MinecraftModule, ForgeModule, LiteloaderModule } from './modules/version'
import { ProfileModule, CreateOption } from './modules/profile';
import { JavaModule } from './modules/java';
import { ResourceModule, Resource } from './modules/resource'
import { TaskModule } from './modules/task';
import { ConfigModule } from './modules/config';
import { Library } from 'ts-minecraft/dest/libs/version';
import { IOModule, Actions as IOActions } from './modules/io';


interface RootDispatch {
    /**
     * Exit the whole system
     */
    (type: "exit"): Promise<void>;
    /**
     * Launch the minecraft
     */
    (type: "launch", profileId: string, option?: { root: true }): Promise<void>;
    (type: 'openDialog', payload: any, option?: { root: true }): Promise<void>;
    (type: 'saveDialog', payload: any, option?: { root: true }): Promise<void>;

    (type: 'cache', url: string, option?: { root: true }): Promise<string>;
    (type: 'readFolder', path: string, option?: { root: true }): Promise<string[]>;
    (type: 'readFolder', path: string, option?: { root: true }): Promise<string[]>;

    (type: 'exists', path: string, option?: { root: true }): Promise<boolean>;
    (type: 'existsAll', paths: string[], option?: { root: true }): Promise<boolean>;
    (type: 'existsAny', paths: string[], option?: { root: true }): Promise<boolean>;

    (type: 'import', payload: { src: string, dest: string }, option?: { root: true }): Promise<void>;
    (type: 'export', payload: { src: string, dest: string }, option?: { root: true }): Promise<void>;

    (type: 'link', payload: { src: string, dest: string }, option?: { root: true }): Promise<void>;

    (type: 'setPersistence', payload: { path: string, data: any }, option?: { root: true }): Promise<void>;
    <T>(type: 'getPersistence', payload: { path: string }, option?: { root: true }): Promise<T?>;


    (type: 'user/selectLoginMode', mode: string, option?: { root: true }): Promise<void>;
    (type: "user/login", payload?: { account: string; password?: string }, options?: DispatchOptions): Promise<void>;
    (type: 'user/logout', option?: { root: true }): Promise<void>;
    (type: 'user/refresh', option?: { root: true }): Promise<void>;
    (type: 'user/refreshInfo', option?: { root: true }): Promise<void>;
    (type: 'user/refreshSkin', option?: { root: true }): Promise<void>;
    (type: 'user/uploadSkin', payload: { data: string | Buffer, slim: boolean }): Promise<void>
    (type: 'user/checkLocation'): Promise<boolean>;
    (type: 'user/getChallenges'): Promise<MojangChallenge[]>;
    (type: 'user/submitChallenges', responses: MojangChallengeResponse[]): Promise<any>;

    (type: 'version/refresh', payload?: undefined, option?: { root: true }): Promise<void>;
    (type: 'version/checkDependencies', version: string, option?: { root: true }): Promise<void>;

    (type: 'version/minecraft/refresh'): Promise<void>;
    (type: 'version/minecraft/download', meta: VersionMeta): Promise<void>;

    (type: 'version/liteloader/refresh'): Promise<void>;
    (type: 'version/liteloader/download', meta: LiteLoader.VersionMeta): Promise<void>;

    (type: 'version/forge/refresh'): Promise<void>;
    (type: 'version/forge/download', meta: ForgeWebPage.Version): Promise<void>;

    (type: 'java/add', location: string | string[]): Promise<void>;
    (type: 'java/remove', location: string | string[]): Promise<void>;
    (type: 'java/install'): Promise<void>;
    (type: 'java/refresh'): Promise<void>;
    (type: 'java/redirect'): Promise<void>;
    (type: 'java/resolve', javaPath: string, option?: { root: true }): Promise<Java>;

    (type: 'profile/create', option: CreateOption): Promise<string>
    (type: 'profile/createAndSelect', option: CreateOption): Promise<void>
    (type: 'profile/select', id: string): Promise<void>
    (type: 'profile/delete', id: string): Promise<void>
    (type: 'profile/resolveResources', id: string): Promise<{ mods: Resource<any>[], resourcepacks: Resource<any>[] }>
    (type: 'profile/diagnose'): Promise<ProfileModule.Problem[]>
    (type: 'profile/export', option: { id: string, dest: string, noAsset: boolean }): Promise<void>
    (type: 'profile/import', location: string): Promise<void>

    (type: 'resource/deploy', payload: { resources: Resource<any>[], minecraft: string }, option?: { root: true }): Promise<void>;
    (type: 'resource/refresh', payload?: undefined, option?: { root: true }): Promise<void>;
    (type: 'resource/remove', resource: string | ResourceModule.Resource, option?: { root: true }): Promise<void>;
    (type: 'resource/rename', option: { resource: string | ResourceModule.Resource<any>, name: string }, option?: { root: true }): Promise<void>;

    (type: 'resource/import', option: ResourceModule.ImportOption, option: { root: true }): Promise<Resource<any>>;
    (type: 'resource/import', option: ResourceModule.ImportOption): Promise<Resource<any>>;

    (type: 'resource/export', option: { resources: (string | ResourceModule.Resource<any>)[], targetDirectory: string }, option?: { root: true }): Promise<void>;
    (type: 'resource/link', option: { resources: (string | ResourceModule.Resource<any>)[], minecraft: string }, option?: { root: true }): Promise<void>;

    (type: 'task/spawn', name: string, option?: { root: true }): Promise<string>;
    (type: 'task/update', progress: { id: string, progress: number, total?: number, message?: string }, option?: { root: true }): Promise<void>;
    (type: 'task/finish', payload: { id: string }, option?: { root: true }): Promise<string>;
    <T>(type: 'task/execute', task: Task<T>, option?: { root: true }): Promise<string>;
    (type: 'task/wait', taskHandle: string, option?: { root: true }): Promise<any>;

}

interface RootGetter {
    ['profile/ids']: string[]
    ['profile/current']: ProfileModule.Profile

    ['version/minecraft/snapshot']: VersionMeta
    ['version/minecraft/release']: VersionMeta
    ['version/minecraft/statuses']: { [version: string]: Status }

    ['version/forge/versions']: (mcversion: string) => Forge.VersionMeta[]
    ['version/forge/latest']: (mcversion: string) => Forge.VersionMeta
    ['version/forge/recommended']: (mcversion: string) => Forge.VersionMeta
    ['version/forge/statuses']: { [version: string]: Status }

    ['java/default']: JavaModule.Java
    ['java/missing']: boolean

    ['resources/domains']: string[]
    ['resources/mods']: (ResourceModule.ForgeResource | ResourceModule.LiteloaderResource)[]
    ['resources/resourcepacks']: ResourceModule.ResourcePackResource[]
    ['resources/getResource'](hash: string): AnyResource | undefined

    ['path']: (...args: string[]) => string

    ['user/history']: string[]
    ['user/logined']: boolean
    ['user/offline']: boolean
    ['user/authModes']: string[]
    ['user/profileModes']: string[]
    ['user/isServiceCompatible']: boolean
    ['user/authService']: string
    ['user/profileService']: string
}

interface Repo extends Store<RootState> {
    commit: {
        (type: 'profile/edit', payload: any): void
        (type: 'profile/gamesettings', settings: GameSetting.Frame): void
    },

    get: RootGetters;
    commits: RootCommit;
    dispatches: RootDispatches;
}

interface RootGetters {
    version: VersionModule.Getters,
    user: UserModule.Getters & {
        minecraft: MinecraftModule.Getters,
        forge: ForgeModule.Getters,
        liteloader: LiteloaderModule.Getters,
    },
    profile: ProfileModule.Getters,
    java: JavaModule.Getters,
    resource: ResourceModule.Getters,
    task: TaskModule.Getters,
    config: ConfigModule.Getters,
}

interface RootDispatches extends Dispatch<IOActions> {
    version: Dispatch<VersionModule.Actions>,
    user: Dispatch<UserModule.Actions> & {
        minecraft: Dispatch<MinecraftModule.Actions>,
        forge: Dispatch<ForgeModule.Actions>,
        liteloader: Dispatch<LiteloaderModule.Actions>,
    },
    profile: Dispatch<ProfileModule.Actions>,
    java: Dispatch<JavaModule.Actions>,
    resource: Dispatch<ResourceModule.Actions>,
    task: Dispatch<TaskModule.Actions>,
    config: Dispatch<ConfigModule.Actions>,
}
interface RootCommit {
    version: Commit<VersionModule.Mutations>,
    user: Commit<UserModule.Mutations> & {
        minecraft: Commit<MinecraftModule.Mutations>,
        forge: Commit<ForgeModule.Mutations>,
        liteloader: Commit<LiteloaderModule.Mutations>,
    },
    profile: Commit<ProfileModule.Mutations>,
    java: Commit<JavaModule.Mutations>,
    resource: Commit<ResourceModule.Mutations>,
    task: Commit<TaskModule.Mutations>,
    config: Commit<ConfigModule.Mutations>,
}

declare module "vue/types/vue" {
    interface Vue {
        $repo: Repo
        $store: Repo
        $electron: RendererInterface
    }
}

interface Commit<Mutations> {
    <T extends keyof Mutations>(type: T, payload?: Parameters<Mutations[T]>[1]): void;
}

interface Dispatch<Actions> {
    <T extends keyof Actions>(type: T, payload?: Parameters<Actions[T]>[1]): ReturnType<Actions[T]>;
}

interface Context<S, G, M, A> {
    state: S, dispatch: RootDispatch & Dispatch<A>; commit: Commit<M>, rootGetters: RootGetter, getters: G, rootState: RootState;
};

type GetterTree<S, G> = {
    [P in keyof G]: (state: S, getters: G, rootState: RootState, rootGetters: RootGetter) => G[P];
}

interface Module<S, G, M, A> extends VModule<S, RootState> {
    state?: S;
    mutations?: M;
    actions?: A;
    getters?: GetterTree<S, G>;
}

interface RootState {
    root: string,
    version: VersionModule.State,
    user: UserModule.State,
    profile: ProfileModule.State,
    java: JavaModule.State,
    resource: ResourceModule.State,
    task: TaskModule.State,
    config: ConfigModule.State,
}
