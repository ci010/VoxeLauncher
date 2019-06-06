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
        config(state: State, payload: any): void;
        locale(state: State, locale: string): void
        allowPrerelease(state: State, allow: boolean): void
        autoInstallOnAppQuit(state: State, autoInstallOnAppQuit: boolean): void
        autoDownload(state: State, autoDownload: boolean): void
        updateInfo(state: State, updateInfo: UpdateInfo): void
        downloadingUpdate(state: State, prog: boolean): void;
        checkingUpdate(state: State, prog: boolean): void;
        settings(state: State, settings: { [key: string]: number | string | boolean | object }): void
    }
    type C = Context<State, {}, Mutations, Actions>;
    interface Actions {
        load(context: C): Promise<void>;
        save(context: C, payload: { mutation: string }): Promise<void>;
        downloadUpdate(context: C): Promise<string | undefined>;
        quitAndInstall(context: C): Promise<void>;
        checkUpdate(context: C): Promise<string>;
    }
}
export interface ConfigModule extends Module<ConfigModule.State, {}, ConfigModule.Mutations, ConfigModule.Actions> { }

declare const mod: ConfigModule;

export default mod;
