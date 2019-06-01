import { Module, Context } from "../store";
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
        checkingUpdate: boolean
        downloadingUpdate: boolean
    }

    interface Mutations {
        locale(state: State, locale: string): void
        downloadingUpdate(state: State, prog: boolean): void;
        checkingUpdate(state: State, prog: boolean): void;
        settings(state: State, settings: { [key: string]: number | string | boolean | object }): void
    }
    type C = Context<State, {}, Mutations, Actions>;
    interface Actions {
        downloadUpdate(context: C): Promise<string>;
        quitAndInstall(context: C): Promise<void>;
        checkUpdate(context: C): Promise<string>;
    }
}
export interface ConfigModule extends Module<ConfigModule.State, ConfigModule.Mutations, ConfigModule.Actions> { }

declare const mod: ConfigModule;

export default mod;
