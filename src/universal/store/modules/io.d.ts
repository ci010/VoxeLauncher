import { Context, Module, TaskHandle } from "../store";

export type IOModule = Module<"io", {}, {}, {}, Actions>;

type C = Context<{}, {}, {}, Actions>;
export interface Actions {
    readFolder(context: C, folder: string): Promise<string[]>;
    setPersistence(context: C, payload: { path: string, data: object }): Promise<void>;
    getPersistence<any>(context: C, payload: { path: string }): Promise<any>;

    electronDownloadFile(context: C, payload: { url: string }): Promise<TaskHandle>
}

declare const mod: IOModule;

export default mod;
