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
import modules from './modules/base';

export type TaskHandle = string;

type C = Context<BaseState, BaseGetters, BaseMutations, BaseActions>
interface BaseActions {
    showItemInFolder(context: C, item: string): Promise<void>;
    openItem(context: C, item: string): Promise<void>;
}
interface BaseGetters {
    path: (...args: string[]) => string
}

interface BaseState {
    root: string
}
interface BaseMutations {
    root(state: State, root: string): void
}

type Mutations = VersionModule.Mutations &
    ProfileModule.Mutations &
    JavaModule.Mutations &
    ResourceModule.Mutations &
    TaskModule.Mutations &
    ConfigModule.Mutations &
    UserModule.Mutations &
    BaseMutations;

type Actions = VersionModule.Actions &
    ProfileModule.Actions &
    JavaModule.Actions &
    ResourceModule.Actions &
    IOActions &
    TaskModule.Actions &
    ConfigModule.Actions &
    UserModule.Actions &
    BaseActions;


type RootDispatch = Dispatch<Actions> & {
    (action: 'save', payload: { mutation: keyof Mutations, payload?: any }): Promise<void>;
}
type RootCommit = Commit<Mutations>;
type RootGetters = VersionModule.Getters &
    UserModule.Getters &
    ProfileModule.Getters &
    JavaModule.Getters &
    ResourceModule.Getters &
    BaseGetters;

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

interface Context<S, G, M, A> {
    state: S, dispatch: RootDispatch & Dispatch<A>; commit: Commit<M>, rootGetters: RootGetters, getters: G, rootState: RootState;
};

type GetterTree<S, G> = {
    [P in keyof G]: (state: S, getters: G, rootState: RootState, rootGetters: RootGetters) => G[P];
}

interface Module<S, G, M, A> extends VModule<S, RootState> {
    state?: S;
    mutations?: M;
    actions?: A & {
        load?: LoadFunction<Context<S, G, M, A>>
        save?: SaveFunction<Context<S, G, M, A>>
        init?: LoadFunction<Context<S, G, M, A>>
    };
    getters?: GetterTree<S, G>;
}

interface RootState extends BaseState {
    version: VersionModule.State,
    user: UserModule.State,
    profile: ProfileModule.State,
    java: JavaModule.State,
    resource: ResourceModule.State,
    task: TaskModule.State,
    config: ConfigModule.State,
}
