import { RootState } from "../store";

export declare namespace ResourceModule {
    interface Signature {
        source: 'disk' | 'remote',
        date: string,
        meta: any,
    }

    type ImportOption = {
        path: string,
        metadata: any
    }

    interface Resource {
        hash: string,
        name: string,
        type: string,
        domain: 'mods' | 'resourcepacks',
        meta: any,
        signature: Signature,
    }

    interface State {
        mods: { [hash: string]: Resource },
        resourcepacks: { [hash: string]: Resource }
    }

    interface Dispatch {
        (type: 'remove', resource: string | Resource): Promise<void>
        (type: 'rename', option: { resource: string | Resource, name: string }): Promise<void>
        (type: 'import', option: ImportOption): Promise<void>
        (type: 'export', option: { resources: (string | Resource)[], targetDirectory: string }): Promise<void>
        (type: 'link', option: { resources: (string | Resource)[], minecraft: string }): Promise<void>
    }
}
export interface ResourceModule extends FullModule<ResourceModule.State, RootState, {}, {}, {}> { }

declare const mod: ResourceModule;

export default mod;
