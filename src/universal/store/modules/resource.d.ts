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
        domain: string | 'mods' | 'resourcepacks',
        metadata: T,
        source: Source,
    }

    type AnyResource = Resource<any>;
    type ForgeResource = Resource<Forge.MetaData[]> & { type: 'forge' };
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
        load(context: C): Promise<void>
        refresh(context: C): Promise<void>
        deploy(context: C, payload: { resources: Resource<any>[], minecraft: string }): Promise<void>
        readForgeLogo(context: C, id: string): Promise<string>
        remove(context: C, resource: string | AnyResource): Promise<void>
        rename(context: C, option: { resource: string | AnyResource, name: string }): Promise<void>
        import(context: C, option: ImportOption): Promise<Resource>
        exports(context: C, option: { resources: (string | AnyResource)[], targetDirectory: string }): Promise<void>
    }
}
export interface ResourceModule extends Module<ResourceModule.State, ResourceModule.Getters, ResourceModule.Mutations, ResourceModule.Dispatch> { }

export type Resource<T> = ResourceModule.Resource<T>;
declare const mod: ResourceModule;

export default mod;
