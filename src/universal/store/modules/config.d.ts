import { FullModule } from "vuex";
import { RootState } from "../store";

export declare namespace ConfigModule {
    interface State {
        locale: string,
        locales: string[],
    }

    interface Commit {
        (type: 'locale', locale: string): void
    }
}
export interface ConfigModule extends FullModule<ConfigModule.State, RootState, {}, Commit, {}> { }

declare const mod: ConfigModule;

export default mod;
