import { Forge, ForgeWebPage, LiteLoader, Version, VersionMetaList } from "ts-minecraft";
import { Library, VersionMeta } from "ts-minecraft/dest/libs/version";
import { Context, Module, TaskHandle } from "../store";
export type Status = 'remote' | 'local';

export declare namespace VersionModule {
    interface LocalVersion {
        minecraft: string,
        forge: string,
        liteloader: string,
        id: string,
        folder: string
    }

    interface WebPage extends ForgeWebPage {
        latest: number
        recommended: number
    }

    interface State {
        local: LocalVersion[]
        minecraft: Version.MetaContainer
        forge: { [mcversion: string]: ForgeWebPage }
        liteloader: LiteLoader.VersionMetaList,
    }

    interface Getters {
        minecraftSnapshot: VersionMeta | undefined,
        minecraftRelease: VersionMeta | undefined,
        minecraftVersion: (mcversion: string) => VersionMeta | undefined,
        minecraftStatuses: { [minecraftVersion: string]: Status };

        forgeVersionsOf: (mcversion: string) => ForgeWebPage | undefined;
        forgeLatestOf: (mcversion: string) => ForgeWebPage.Version | undefined;
        forgeRecommendedOf: (mcversion: string) => ForgeWebPage.Version | undefined;
        forgeStatuses: { [forgeVersion: string]: Status };

        liteloaderVersionsOf: (mcversion: string) => {
            snapshot?: LiteLoader.VersionMeta;
            release?: LiteLoader.VersionMeta;
        }
    }

    interface Mutations {
        localVersions(state: State, local: LocalVersion[]): void;
        minecraftMetadata(state: State, metadatas: Version.MetaContainer): void;
        forgeMetadata(state: State, metadatas: ForgeWebPage): void;
        liteloaderMetadata(state: State, metadatas: LiteLoader.VersionMetaList): void;
    }

    type C = Context<State, {}, Mutations, Actions>;
    interface Actions {
        refresh(context: C): Promise<void>

        refreshVersions(context: C): Promise<void>
        refreshMinecraft(context: C): Promise<void>
        refreshForge(context: C): Promise<void>
        refreshLiteloader(context: C): Promise<void>

        resolveVersion(context: C, version: Pick<LocalVersion, 'minecraft' | 'forge' | 'liteloader' | 'folder'>): Promise<string>

        installLibraries(context: C, payload: { libraries: Library[] }): Promise<TaskHandle>;
        installAssets(context: C, version: string): Promise<TaskHandle>
        installDependencies(context: C, version: string): Promise<TaskHandle>

        installMinecraft(context: C, version: VersionMeta): Promise<TaskHandle>
        installForge(context: C, version: Forge.VersionMeta): Promise<TaskHandle>
        installLiteloader(context: C, version: LiteLoader.VersionMeta): Promise<TaskHandle>
    }
}

export interface VersionModule extends Module<VersionModule.State, VersionModule.Getters, VersionModule.Mutations, VersionModule.Actions> {
}

declare const mod: VersionModule;
export default mod;
