import { RootState } from "../store";
import { Forge, LiteLoader, ResourcePack } from "ts-minecraft";
import { FullModule } from "vuex";

export declare namespace ResourceModule {
    interface Source {
        path: string,
        date: string | number,
        [key: string]: string
    }

    type ImportOption = {
        path: string,
        metadata?: any
    }

    interface Resource<T> {
        name: string,
        path: string,
        hash: string,
        ext: string,
        type: string,
        domain: 'mods' | 'resourcepacks',
        metadata: T,
        source: Source,
    }

    type ForgeResource = Resource<Forge.MetaData> & { type: 'forge' };
    type LiteloaderResource = Resource<LiteLoader.MetaData> & { type: 'liteloader' };
    type ResourcePackResource = Resource<ResourcePack> & { type: 'resourcepack' };

    interface State {
        mods: { [hash: string]: ForgeResource | LiteloaderResource },
        resourcepacks: { [hash: string]: ResourcePackResource }
    }

    interface Dispatch {
        (type: 'remove', resource: string | Resource<any>): Promise<void>
        (type: 'rename', option: { resource: string | Resource<any>, name: string }): Promise<void>
        (type: 'import', option: ImportOption): Promise<Resource>
        (type: 'export', option: { resources: (string | Resource<any>)[], targetDirectory: string }): Promise<void>
        (type: 'link', option: { resources: (string | Resource<any>)[], minecraft: string }): Promise<void>
    }
}
export interface ResourceModule extends FullModule<ResourceModule.State, RootState, {}, {}, {}> { }

export type Resource<T> = ResourceModule.Resource<T>;
declare const mod: ResourceModule;

export default mod;
