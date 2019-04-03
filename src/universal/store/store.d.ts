import { Store, Dispatch, DispatchOptions, MutationTree } from 'vuex'
import { GameProfile, MojangAccount, VersionMeta, Forge, LiteLoader } from 'ts-minecraft';
import { RendererInterface } from 'electron';

import { UserModule } from './modules/user'
import { VersionModule } from './modules/versions'
import { ProfileModule, CreateOption } from './modules/profile';
import { JavaModule } from './modules/java';
import { ResourceModule } from './modules/resource'
import { TaskModule } from './modules/task';


interface RootDispatch {
    /**
     * Exit the whole system
     */
    (type: "exit"): Promise<void>;
    /**
     * Launch the minecraft
     */
    (type: "launch", profileId: string): Promise<void>;
    (type: 'openDialog', payload: any): Promise<void>;
    (type: 'saveDialog', payload: any): Promise<void>;

    (type: 'cache', url: string): Promise<string>;
    (type: 'readFolder', path: string): Promise<string[]>;

    (type: 'exists', path: string): Promise<boolean>;
    (type: 'existsAll', paths: string[]): Promise<boolean>;
    (type: 'existsAny', paths: string[]): Promise<boolean>;

    (type: 'read', payload: { path: string, fallback?: string }): Promise<string | undefined>;
    (type: 'read', payload: { path: string, type: 'string', fallback?: string }): Promise<string | undefined>;
    <T>(type: 'read', payload: { path: string, type: 'json', fallback?: object }): Promise<T | undefined>;
    <T>(type: 'read', payload: { path: string, type: (buf: Buffer) => T }, fallback: ?T): Promise<T | undefined>;

    (type: 'write', payload: { path: string, data: string | Buffer | object, external?: boolean }): Promise<void>;

    (type: 'delete', path: string): Promise<void>;

    (type: 'import', payload: { src: string, dest: string }): Promise<void>;
    (type: 'export', payload: { src: string, dest: string }): Promise<void>;

    (type: 'link', payload: { src: string, dest: string }): Promise<void>;
}

interface RootGetter {
    ['profile/current']: ProfileModule.Profile
}

interface Repo extends Store<RootState> {
    getters: RootGetter;
    dispatch: RootDispatch & {
        (type: 'user/selectLoginMode', mode: string): Promise<void>;

        (
            type: "user/login",
            payload?: { account: string; password?: string },
            options?: DispatchOptions
        ): Promise<void>;
        (type: 'user/logout'): Promise<void>;

        (type: 'user/refresh'): Promise<void>;
        (type: 'user/refreshInfo'): Promise<void>;
        (type: 'user/refreshSkin'): Promise<void>;

        (type: 'user/uploadSkin', payload: { data: string, slim: boolean }): Promise<void>

        (type: 'versions/refresh'): Promise<void>;
        (type: 'versions/checkDependency', version: string): Promise<void>;

        (type: 'versions/minecraft/refresh'): Promise<void>;
        (type: 'versions/minecraft/download', meta: VersionMeta): Promise<void>;

        (type: 'versions/liteloader/refresh'): Promise<void>;
        (type: 'versions/liteloader/download', meta: LiteLoader.VersionMeta): Promise<void>;

        (type: 'versions/forge/refresh'): Promise<void>;
        (type: 'versions/forge/download', meta: Forge.VersionMeta): Promise<void>;

        (type: 'java/add', location: string | string[]): Promise<void>;
        (type: 'java/remove', location: string | string[]): Promise<void>;
        (type: 'java/install'): Promise<void>;
        (type: 'java/refresh'): Promise<void>;
        (type: 'java/test', javaPath: string): Promise<void>;
        (type: 'java/download'): Promise<void>;

        (type: 'profile/createAndSelect', option: CreateOption): Promise<void>
        (type: 'profile/create', option: CreateOption): Promise<string>
        (type: 'profile/delete', id: string): Promise<void>
        (type: 'profile/select', id: string): Promise<void>
        (type: 'profile/edit', payload: { id: string }): Promise<void>
        (type: 'profile/diagnose'): Promise<void>

        (type: 'profile/enableForge'): Promise<void>;
        (type: 'profile/addForgeMod'): Promise<void>;
        (type: 'profile/delForgeMod'): Promise<void>;

        (type: 'profile/enableLiteloader'): Promise<void>;
        (type: 'profile/addLiteloaderMod'): Promise<void>;
        (type: 'profile/delLiteloaderMod'): Promise<void>;

        (type: 'resource/remove', resource: string | ResourceModule.Resource): Promise<void>
        (type: 'resource/rename', option: { resource: string | ResourceModule.Resource, name: string }): Promise<void>
        (type: 'resource/import', option: ResourceModule.ImportOption): Promise<void>
        (type: 'resource/export', option: { resources: (string | ResourceModule.Resource)[], targetDirectory: string }): Promise<void>
        (type: 'resource/link', option: { resources: (string | ResourceModule.Resource)[], minecraft: string }): Promise<void>
    }
}

declare module "vue/types/vue" {
    interface Vue {
        $repo: Repo
        $electron: RendererInterface
    }
}

declare module "vuex" {
    interface FullModule<S, R, G, M, D> extends Module<S, R> {
        actions?: ActionTree<S, R> & {
            [key: string]: (this: Store<S>, injectee: { state: S, dispatch: D & RootDispatch; commit: M, rootGetters: RootGetter, getters: G, rootState: RootState }, payload: any) => any & Action<S, R>;
        };
    }
}

interface RootState {
    root: string,
    versions: VersionModule.State,
    user: UserModule.State,
    profile: ProfileModule.State,
    java: JavaModule.State,
    resource: ResourceModule.State,
    task: TaskModule.State,
}
