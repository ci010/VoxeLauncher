import { FullModule } from "vuex";
import { RootState } from "../store";
import { UpdateInfo } from "electron-updater";

export declare namespace ConfigModule {
    interface State {
        locale: string,
        locales: string[],
        settings: { [key: string]: number | string | boolean | object },
        updateInfo: UpdateInfo | null,
        
        autoDownload: boolean
        autoInstallOnAppQuit: boolean
        allowPrerelease: boolean

        readyToUpdate: boolean
    }

    interface Commit {
        (type: 'locale', locale: string): void
        (type: 'settings', settings: { [key: string]: number | string | boolean | object }): void
    }
}
export interface ConfigModule extends FullModule<ConfigModule.State, RootState, {}, Commit, {}> { }

declare const mod: ConfigModule;

export default mod;
