import { Context, Module } from "../store";
import { Forge, LiteLoader, ResourcePack } from "ts-minecraft";

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

    type AnyResource = Resource<any>;
    type ForgeResource = Resource<Forge.MetaData> & { type: 'forge' };
    type LiteloaderResource = Resource<LiteLoader.MetaData> & { type: 'liteloader' };
    type ResourcePackResource = Resource<ResourcePack> & { type: 'resourcepack' };

    interface State {
        mods: { [hash: string]: ForgeResource | LiteloaderResource },
        resourcepacks: { [hash: string]: ResourcePackResource }
    }
    interface Getters {
        domains: string[]
        mods: (ResourceModule.ForgeResource | ResourceModule.LiteloaderResource)[]
        resourcepacks: ResourceModule.ResourcePackResource[]
        getResource(hash: string): AnyResource | undefined
    }

    interface Mutations {
        rename(state: State, option: { domain: string, hash: string, name: string }): void;
        resource(state: State, resource: ResourceModule.AnyResource): void;
        resources(state: State, resources: ResourceModule.AnyResource[]): void;
        remove(state: State, resource: ResourceModule.AnyResource): void;
    }
    type C = Context<State, Getters, Mutations, Dispatch>;

    interface Dispatch {
        refresh(context: C): Promise<void>
        remove(context: C, resource: string | Resource<any>): Promise<void>
        rename(context: C, option: { resource: string | Resource<any>, name: string }): Promise<void>
        import(context: C, option: ImportOption): Promise<Resource>
        export(context: C, option: { resources: (string | Resource<any>)[], targetDirectory: string }): Promise<void>
        link(context: C, option: { resources: (string | Resource<any>)[], minecraft: string }): Promise<void>
    }
}
export interface ResourceModule extends Module<ResourceModule.State, ResourceModule.Mutations, ResourceModule.Dispatch> { }

export type Resource<T> = ResourceModule.Resource<T>;
declare const mod: ResourceModule;

export default mod;
