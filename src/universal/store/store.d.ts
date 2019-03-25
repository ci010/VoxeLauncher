import { Store, Dispatch, DispatchOptions, MutationTree } from 'vuex'
import { GameProfile, MojangAccount, VersionMeta, Forge, LiteLoader } from 'ts-minecraft';


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

        (type: 'profiles/create', payload: CreateOption): Promise<string>;
        (type: 'profiles/delete', profileId: string): Promise<void>;

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

import { UserModule } from './modules/user'
import { VersionModule } from './modules/versions'

interface RootState {
    root: string,
    versions: VersionModule.State,
    users: UserModule.State,

    profiles: ProfilesState,
}
