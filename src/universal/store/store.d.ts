import { Store, Dispatch, DispatchOptions, MutationTree } from 'vuex'
import { GameProfile, MojangAccount, VersionMeta, Forge, LiteLoader } from 'ts-minecraft';

import { UserModule } from './modules/user'
import { VersionModule } from './modules/versions'
import { ProfileModule, CreateOption } from './modules/profile';
import { JavaModule } from './modules/java';

interface Repo extends Store<RootState> {
    dispatch: {
        (
            type: "user/login",
            payload?: { account: string; password?: string },
            options?: DispatchOptions
        ): Promise<void>;
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

        (type: 'request', url: string): Promise<Buffer>;
        (type: 'download', url: string): Promise<Buffer>;

        (type: 'cache', url: string): Promise<string>;
        (type: 'readFolder', payload: { path: string }): Promise<string[]>;
        (type: 'delete', path: string): Promise<void>;

        (type: 'import', payload: { file: string, name: string }): Promise<void>;
        (type: 'export', payload: { file: string, name: string }): Promise<void>;

        (type: 'link', payload: { file: string, name: string }): Promise<void>;

        (type: 'versions/load'): Promise<void>;
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

        (type: 'profile/create', option: CreateOption): Promise<string>
        (type: 'profile/delete', id: string): Promise<void>
        (type: 'profile/select', id: string): Promise<void>
        (type: 'profile/edit', payload: { id: string }): Promise<void>

        (type: 'profile/enableForge'): Promise<void>;
        (type: 'profile/addForgeMod'): Promise<void>;
        (type: 'profile/delForgeMod'): Promise<void>;

        (type: 'profile/enableLiteloader'): Promise<void>;
        (type: 'profile/addLiteloaderMod'): Promise<void>;
        (type: 'profile/delLiteloaderMod'): Promise<void>;
    }
}

declare module "vue/types/vue" {
    interface Vue {
        $repo: Repo
    }
}

declare module "vuex" {
    interface FullModule<S, R, G, M, D> extends Module<S, R> {
        actions?: ActionTree<S, R> & {
            [key: string]: (this: Store<S>, injectee: ActionContext<S, R> & { dispatch: D; commit: M }, payload: any) => any & Action<S, R>;
        };
    }
}

interface RootState {
    root: string,
    versions: VersionModule.State,
    users: UserModule.State,
    profiles: ProfileModule.State,
    java: JavaModule.State,
}
