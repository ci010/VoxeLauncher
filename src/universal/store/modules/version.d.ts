import { VersionMetaList, ForgeWebPage, LiteLoader, VersionMeta, MetaContainer, Forge } from "ts-minecraft";
import { RootState, Module, Context } from "../store";
import liteloader from "../helpers/profiles/modules/liteloader";
import { Library } from "ts-minecraft/dest/libs/version";
interface InnerState {
    timestamp: string,
}
export type Status = 'remote' | 'local';

export declare namespace MinecraftModule {
    interface State extends InnerState {
        latest: {
            snapshot: string;
            release: string;
        };
        versions: { [version: string]: VersionMeta };
    }

    interface Getters {
        snapshot: VersionMeta,
        release: VersionMeta,
        status: (version: string) => Status;
        statuses: { [version: string]: Status };
    }


    interface Mutations {
        update(state: State, metadatas: MetaContainer): void;
    }

    type C = Context<State, Getters, Mutations, Actions>;

    interface Actions {
        load(context: C): Promise<void>
        save(context: C): Promise<void>
        download(context: C, meta: VersionMeta): Promise<string>
        refresh(context: C): Promise<void>
    }
}
export declare namespace ForgeModule {

    interface WebPage extends ForgeWebPage {
        latest: number
        recommended: number
    }
    interface State extends InnerState {
        mcversions: {
            [mcversion: string]: WebPage
        }
    }

    interface Getters {
        versions: (mcversion: string) => WebPage;
        latest: (mcversion: string) => ForgeWebPage.Version;
        recommended: (mcversion: string) => ForgeWebPage.Version;
        status: (version: string) => Status;
        statuses: { [version: string]: Status };
    }

    interface Mutations {
        update(state: State, metadatas: ForgeWebPage): void;
        load(state: State, state: State): void;
    }
    type C = Context<State, Getters, Mutations, Actions>;

    interface Actions {
        load(context: C): Promise<void>
        save(context: C): Promise<void>

        download(context: C, meta: Forge.VersionMeta): Promise<string>
        refresh(context: C): Promise<void>
    }
}

export declare namespace LiteloaderModule {
    interface State extends LiteLoader.VersionMetaList, InnerState {
    }
    type C = Context<State, Getters, Mutations, Actions>;

    interface Mutations {
        update(state: State, content: State): void;
    }
    interface Getters {
        versions: (mcversion: string) => State["versions"][""]
    }

    interface Actions {
        load(context: C): Promise<void>
        save(context: C): Promise<void>

        download(context: C, meta: LiteLoader.VersionMeta): Promise<string>
        refresh(context: C): Promise<void>
    }
}
export declare namespace VersionModule {
    interface LocalVersion {
        minecraft: string, 
        forge: string, 
        liteloader: string, 
        id: string, 
        folder: string
    }

    interface State {
        local: LocalVersion[],
        libraryHost: { [libname: string]: string },
        assetHost: string,

        forge: ForgeModule.State,
        minecraft: MinecraftModule.State,
        liteloader: LiteloaderModule.State,
    }

    interface Mutations {
        local(state: State, local: LocalVersion[]): void;
    }

    type C = Context<State, {}, Mutations, Actions>;
    interface Actions {
        load(context: C): Promise<void>
        downloadLibraries(context: C, payload: { libraries: Library[] }): Promise<string>;
        resolve(context: C, version: LocalVersion): Promise<string>
        refresh(context: C): Promise<void>
        checkDependencies(context: C, version: string): Promise<string>
    }
}

export interface VersionModule extends Module<VersionModule.State, {}, VersionModule.Mutations, VersionModule.Actions> {
    modules: {
        minecraft: Module<MinecraftModule.State, MinecraftModule.Getters, MinecraftModule.Mutations, MinecraftModule.Actions>
        forge: Module<ForgeModule.State, ForgeModule.Getters, ForgeModule.Mutations, ForgeModule.Actions>
        liteloader: Module<LiteloaderModule.State, LiteloaderModule.Getters, LiteloaderModule.Mutations, LiteloaderModule.Actions>
    }
}

declare const mod: VersionModule;
export default mod;
