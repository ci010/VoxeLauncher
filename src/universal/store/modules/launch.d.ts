import { FullModule, Dispatch } from "vuex";
import { RootState } from "../store";

export interface Dispatch {
    (type: 'launch', profileId: string): Promise<void>;
}

export type LauncherModule = FullModule<{}, RootState, {}, {}, Dispatch>;

declare const mod: LauncherModule;

export default mod;
