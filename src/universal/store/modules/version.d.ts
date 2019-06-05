import { VersionMetaList, ForgeWebPage, LiteLoader, VersionMeta, Forge } from "ts-minecraft";
import { RootState, Module, Context } from "../store";
interface InnerState {
    status: { [version: string]: Status },
    timestamp: number,
}
type Status = 'remote' | 'local' | 'loading'

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
        update(state: State, metadatas: VersionMetaList): void;
    }

    type C = Context<State, Getters, Mutations, Actions>;

    interface Actions {
        download(context: C, meta: VersionMeta): Promise<void>
        refresh(context: C): Promise<void>
    }
}
export declare namespace ForgeModule {
    interface State extends InnerState {
        mcversions: {
            [mcversion: string]: {
                versions: ForgeWebPage.Version[];
                mcversion: string;
                latest: number,
                recommended: number,
                timestamp: number,
            }
        }
    }

    interface Getters {
        versions: (mcversion: string) => ForgeWebPage;
        latest: (mcversion: string) => ForgeWebPage.Version;
        recommended: (mcversion: string) => ForgeWebPage.Version;
        status: (version: string) => Status;
        statuses: { [version: string]: Status };
    }

    interface Mutations {
        update(state: State, metadatas: ForgeWebPage): void;
    }
    type C = Context<State, Getters, Mutations, Actions>;

    interface Actions {
        download(context: C, meta: Forge.VersionMeta): Promise<void>
        refresh(context: C): Promise<void>
    }
}

export declare namespace LiteloaderModule {
    interface State extends LiteLoader.VersionMetaList, InnerState {
    }
    type C = Context<State, {}, {}, Actions>;

    interface Actions {
        download(context: C, meta: LiteLoader.VersionMeta): Promise<void>
        refresh(context: C): Promise<void>
    }
}
export declare namespace VersionModule {
    interface LocalVersion { minecraft: string, forge?: string, liteloader?: string, id: string }

    interface State {
        local: LocalVersion[],
        minecraft: MinecraftModule.State,
        forge: ForgeModule.State,
        liteloader: any,
    }

    interface Mutations {
        local(local: LocalVersion[]): void;
        load(id: string): void;
    }

    type C = Context<State, {}, Mutations, Actions>;
    interface Actions {
        refresh(context: C): Promise<void>
        checkDependencies(context: C, version: string): Promise<void>
    }
}

export interface VersionModule extends Module<VersionModule.State, VersionModule.Mutations, VersionModule.Actions> {
    modules: {
        minecraft: Module<MinecraftModule.State, MinecraftModule.Mutations, MinecraftModule.Actions>
        forge: Module<ForgeModule.State, ForgeModule.Mutations, ForgeModule.Actions>
        liteloader: Module<LiteloaderModule.State, {}, LiteloaderModule.Actions>
    }
}

declare const mod: VersionModule;
export default mod;
