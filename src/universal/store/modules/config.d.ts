import { FullModule } from "vuex";
import { RootState } from "../store";

export declare namespace ConfigModule {
    interface State {
        locale: string,
        locales: string[],
        settings: { [key: string]: number | string | boolean | object },
        allowPrerelease: boolean
    }

    interface Commit {
        (type: 'locale', locale: string): void
        (type: 'settings', settings: { [key: string]: number | string | boolean | object }): void
    }
}
export interface ConfigModule extends FullModule<ConfigModule.State, RootState, {}, Commit, {}> { }

declare const mod: ConfigModule;

export default mod;
