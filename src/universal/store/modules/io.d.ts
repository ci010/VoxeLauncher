import { Context, Module } from "../store";

export type IOModule = Module<{}, never, never, Actions>;

type C = Context<{}, {}, {}, Actions>;
export interface Actions {
    readFolder(context: C, folder: string): Promise<string[]>;
    setPersistence(context: C, payload: { path: string, data: object }): Promise<void>;
    getPersistence<T>(context: C, payload: { path: string }): Promise<T>;
}

declare const mod: IOModule;

export default mod;
