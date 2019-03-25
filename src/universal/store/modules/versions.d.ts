import { FullModule } from "vuex";
import { VersionMetaList, ForgeWebPage, LiteLoader, VersionMeta, Forge } from "ts-minecraft";
import { RootState } from "../store";

export declare namespace VersionModule {
    type Status = 'remote' | 'local' | 'loading'

    interface InnerState {
        status: { [version: string]: Status }
    }

    interface State {
        local: { minecraft: string, forge?: string, liteloader?: string, id: string }[],
        minecraft: MinecraftState,
        forge: ForgeState,
        liteloader: LiteState,
    }

    interface MinecraftState extends VersionMetaList, InnerState { }

    interface ForgeState extends ForgeWebPage, InnerState { }

    interface LiteState extends LiteLoader.VersionMetaList, InnerState { }

    interface Dispatch {
        (type: 'refresh'): Promise<void>
        (type: 'checkDependency', version: string): Promise<void>
    }
    interface MinecraftDispatch {
        (type: 'download', meta: VersionMeta): Promise<void>
        (type: 'refresh'): Promise<void>
    }
    interface ForgeDispatch {
        (type: 'download', meta: Forge.VersionMeta): Promise<void>
        (type: 'refresh'): Promise<void>
    }
    interface LiteLoaderDispatch {
        (type: 'download', meta: LiteLoader.VersionMeta): Promise<void>
        (type: 'refresh'): Promise<void>
    }
}

export interface VersionModule extends FullModule<VersionModule.State, RootState, never, never, VersionModule.Dispatch> {
    modules: {
        minecraft: FullModule<VersionModule.MinecraftState, RootState, never, never, VersionModule.MinecraftDispatch>
        forge: FullModule<VersionModule.ForgeState, RootState, never, never, VersionModule.ForgeDispatch>
        liteloader: FullModule<VersionModule.LiteState, RootState, never, never, VersionModule.LiteLoaderDispatch>
    }
}

declare const mod: VersionModule;
export default mod;
