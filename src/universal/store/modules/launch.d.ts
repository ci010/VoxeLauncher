import { FullModule, Dispatch } from "vuex";
import { RootState } from "../store";

export interface Dispatch {
    (type: 'launch', profileId: string): Promise<void>;
}

declare const mod: FullModule<{}, RootState, {}, {}, Dispatch>;

export default mod;
