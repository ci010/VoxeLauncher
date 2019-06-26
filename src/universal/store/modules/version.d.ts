import { Forge, ForgeWebPage, LiteLoader, Version, VersionMetaList } from "ts-minecraft";
import { Library, VersionMeta } from "ts-minecraft/dest/libs/version";
import { Context, Module, TaskHandle } from "../store";
export type Status = 'remote' | 'local';

/**
 * The module handle the local/remote version related work 
 */
export declare namespace VersionModule {
    /**
     * An interface to reference a resolved version in 
     * <minecraft folder>/versions/<version-id>/<version-id>.json
     * 
     * This is more lightweight than ts-minecraft's Version by Version.parse.
     */
    interface ResolvedVersion {
        /**
         * Minecraft version of this version. e.g. 1.7.10
         */
        minecraft: string,
        /**
         * Forge version of this version. e.g. 14.23.5.2838
         */
        forge: string,
        liteloader: string,
        /**
         * The ideal id this version, which is computed by 
         * function universal/utils/versions.js#getExpectVersion
         */
        id: string,
        /**
         * The real folder id of the version, which is the <verison-id> in
         * 
         * <minecraft folder>/versions/<version-id>/<version-id>.json
         */
        folder: string
    }

    interface WebPage extends ForgeWebPage {
        latest: number
        recommended: number
    }

    interface State {
        local: ResolvedVersion[]
        minecraft: Version.MetaContainer
        refreshingMinecraft: boolean
        forge: { [mcversion: string]: ForgeWebPage }
        refreshingForge: boolean
        liteloader: LiteLoader.VersionMetaList,
        refreshingLiteloader: boolean
    }

    interface Getters {
        /**
         * Latest snapshot
         */
        minecraftSnapshot: VersionMeta | undefined,
        /**
         * Latest release
         */
        minecraftRelease: VersionMeta | undefined,
        minecraftVersion: (mcversion: string) => VersionMeta | undefined,
        minecraftStatuses: { [minecraftVersion: string]: Status };

        /**
         * Get the forge webpage info by a minecraft version
         */
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
        refreshingMinecraft(state: State, refreshing: boolean): void;
        refreshingForge(state: State, refreshing: boolean): void;
        refreshingLiteloader(state: State, refreshing: boolean): void;

        localVersions(state: State, local: ResolvedVersion[]): void;
        minecraftMetadata(state: State, metadatas: Version.MetaContainer): void;
        forgeMetadata(state: State, metadatas: ForgeWebPage): void;
        liteloaderMetadata(state: State, metadatas: LiteLoader.VersionMetaList): void;
    }

    type C = Context<State, {}, Mutations, Actions>;
    interface Actions {
        refresh(context: C): Promise<void>

        refreshVersions(context: C): Promise<void>
        /**
         * Request minecraft version list and cache in to store and disk.
         */
        refreshMinecraft(context: C): Promise<void>
        refreshForge(context: C, mcversion: string): Promise<void>
        refreshLiteloader(context: C): Promise<void>

        getForgeWebPage(context: C, mcversion: string): Promise<ForgeWebPage | undefined>

        resolveVersion(context: C, version: Pick<ResolvedVersion, 'minecraft' | 'forge' | 'liteloader' | 'folder'>): Promise<string>

        installLibraries(context: C, payload: { libraries: Library[] }): Promise<TaskHandle>;
        installAssets(context: C, version: string): Promise<TaskHandle>
        installDependencies(context: C, version: string): Promise<TaskHandle>

        installMinecraft(context: C, version: VersionMeta): Promise<TaskHandle>
        installForge(context: C, version: Forge.VersionMeta): Promise<TaskHandle>
        installLiteloader(context: C, version: LiteLoader.VersionMeta): Promise<TaskHandle>

        showVersionDirectory(context: C, version: string): Promise<void>;
        showVersionsDirectory(context: C): Promise<void>;

        deleteVersion(context: C, version: string): Promise<void>;
    }
}

export interface VersionModule extends Module<"version", VersionModule.State, VersionModule.Getters, VersionModule.Mutations, VersionModule.Actions> {
}

declare const mod: VersionModule;
export default mod;
