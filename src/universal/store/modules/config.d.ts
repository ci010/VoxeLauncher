import { Module } from "../store";
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

    interface Mutations {
        locale(state: State, locale: string): void
        settings(state: State, settings: { [key: string]: number | string | boolean | object }): void
    }
}
export interface ConfigModule extends Module<ConfigModule.State, ConfigModule.Mutations, {}> { }

declare const mod: ConfigModule;

export default mod;
