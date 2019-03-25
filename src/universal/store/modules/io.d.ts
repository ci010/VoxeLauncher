import { FullModule } from "vuex";
import { RootState } from "../store";

export type IOModule = FullModule<{}, RootState, never, never, Dispatch>;
export interface Dispatch {
    (type: 'request', url: string): Promise<Buffer>;
    (type: 'download', url: string): Promise<Buffer>;

    (type: 'cache', url: string): Promise<string>;
    (type: 'readFolder', payload: { path: string }): Promise<string[]>;
    (type: 'delete', path: string): Promise<void>;

    (type: 'import', payload: { file: string, name: string }): Promise<void>;
    (type: 'export', payload: { file: string, name: string }): Promise<void>;

    (type: 'link', payload: { file: string, name: string }): Promise<void>;
}

declare const mod: IOModule;

export default mod;
