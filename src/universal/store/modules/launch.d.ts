import { Module, Context } from "../store";

export type C = Context<{}, {}, {}, Actions>;
export interface Actions {
    launch(context: C, profileId: string): Promise<void>;
}

export type LauncherModule = Module<{}, {}, {}, Actions>;

declare const mod: LauncherModule;

export default mod;
