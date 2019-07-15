import { Store, DispatchOptions, MutationTree, ActionTree, Module as VModule, Action } from 'vuex'
import { GameProfile, MojangAccount, VersionMeta, Forge, LiteLoader, GameSetting, ForgeWebPage, MojangChallengeResponse, MojangChallenge } from 'ts-minecraft';
import { RendererInterface, Remote } from 'electron';
import { Task } from 'treelike-task';

import { UserModule } from './modules/user'
import { VersionModule, MinecraftModule, ForgeModule, LiteloaderModule } from './modules/version'
import { ProfileModule, CreateOption } from './modules/profile';
import { JavaModule } from './modules/java';
import { ResourceModule, Resource } from './modules/resource'
import { TaskModule } from './modules/task';
import { DiagnoseModule } from './modules/diagnose';
import { ConfigModule } from './modules/config';
import { Library } from 'ts-minecraft/dest/libs/version';
import { IOModule, Actions as IOActions } from './modules/io';
import modules from './modules/base';
import { LauncherModule, State as LaunchState, Mutations as LaunchMutations } from './modules/launch';

export type TaskHandle = string;

type C = Context<BaseState, BaseGetters, BaseMutations, BaseActions>
interface BaseActions {
    showItemInFolder(context: C, item: string): Promise<void>;
    openItem(context: C, item: string): Promise<void>;
}
interface BaseGetters {
    /**
     * @returns the path relate to the launcher root data folder
     */
    path: (...args: string[]) => string
}

interface BaseState {
    /**
     * launcher root data folder path
     */
    root: string
    online: boolean
    platform: NodeJS.Platform
}
interface BaseMutations {
    root(state: State, root: string): void
    online(state: State, online: boolean): void
    platform(state: State, platform: NodeJS.Platform): void
}

type AllModules = VersionModule | ProfileModule | JavaModule | ResourceModule | TaskModule | ConfigModule | UserModule | LauncherModule | IOModule | DiagnoseModule;
type ModulesIntersection = VersionModule & ProfileModule & JavaModule & ResourceModule & TaskModule & ConfigModule & UserModule & LauncherModule & IOModule & DiagnoseModule;
interface ModulesCollection extends ModulesIntersection { }

type Mutations =
    Required<ModulesCollection>["mutations"] &
    BaseMutations;

type Actions =
    Required<ModulesCollection>["actions"] &
    BaseActions;

type RootDispatch = Dispatch<Actions> & {
    (action: 'save', payload: { mutation: keyof Mutations, payload?: any }): Promise<void>;
}
type RootCommit = Commit<Mutations>;

type AllGetters = UseGetters<Required<ModulesCollection>["getters"]> & BaseGetters;

interface RootGetters extends AllGetters { }

type SaveFunction<C> = (context: C, payload: { mutation: keyof Mutations, payload: any }) => Promise<void>;
type LoadFunction<C> = (context: C) => Promise<void>;

interface Repo extends Store<RootState> {
    commit: RootCommit;
    dispatch: RootDispatch;
    getters: RootGetters;
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

type UseGetters<GetterTree> = {
    [K in keyof GetterTree]: ReturnType<GetterTree[K]>
}

interface Context<S, G, M, A> {
    state: S, dispatch: RootDispatch & Dispatch<A>; commit: Commit<M> & RootCommit, rootGetters: RootGetters, getters: G, rootState: RootState;
};

type GetterTree<S, G> = {
    [P in keyof G]: (state: S, getters: G, rootState: RootState, rootGetters: RootGetters) => G[P];
}

interface Module<N, S, G, M, A> extends VModule<S, RootState> {
    name?: N;
    state?: S;
    mutations?: M;
    actions?: A & {
        load?: LoadFunction<Context<S, G, M, A>>
        save?: SaveFunction<Context<S, G, M, A>>
        init?: LoadFunction<Context<S, G, M, A>>
    };
    getters?: GetterTree<S, G>;
}

type StateTree = {
    [K in Required<AllModules>["name"]]: Extract<Required<AllModules>, { name: K }>["state"]
} & BaseState;

interface RootState extends StateTree {
}
