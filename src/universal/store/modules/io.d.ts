import { FullModule } from "vuex";
import { RootState } from "../store";

export type IOModule = FullModule<{}, RootState, never, never, Dispatch>;
export interface Dispatch {
    (type: 'request', url: string): Promise<Buffer>;
    (type: 'download', url: string): Promise<Buffer>;

    (type: 'cache', url: string): Promise<string>;
    (type: 'readFolder', path: string ): Promise<string[]>;

    (type: 'exists', path: string): Promise<boolean>;
    (type: 'existsAll', paths: string[]): Promise<boolean>;
    (type: 'existsAny', paths: string[]): Promise<boolean>;

    (type: 'read', payload: { path: string, type: 'string', fallback?: string }): Promise<string | undefined>;
    <T>(type: 'read', payload: { path: string, type: 'json', fallback?: object }): Promise<T | undefined>;
    <T>(type: 'read', payload: { path: string, type: (buf: Buffer) => T }, fallback: ?T): Promise<T | undefined>;

    (type: 'write', payload: { path: string, data: string | Buffer | object, external?: boolean }): Promise<void>;

    (type: 'delete', path: string): Promise<void>;

    (type: 'import', payload: { src: string, dest: string }): Promise<void>;
    (type: 'export', payload: { src: string, dest: string }): Promise<void>;

    (type: 'link', payload: { src: string, dest: string }): Promise<void>;
}

declare const mod: IOModule;

export default mod;
