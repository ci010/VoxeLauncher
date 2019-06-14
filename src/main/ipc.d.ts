import { Event, IpcMain, BrowserWindow } from "electron";
import { RootState } from "universal/store/store";
import { Store } from "vuex";

export interface CustomEvents {
    on(channel: 'browser-window-setup', listener: (window: BrowserWindow, name: string) => void): this;
    on(channel: 'exit', listener: () => void): this;
    on(channel: 'locale-changed', listener: () => void): this;

    on(channel: 'store-ready', listener: (store: Store<RootState>) => void): this;

    on(channel: 'minecraft-start', listener: () => void): this;
    on(channel: 'minecraft-exit', listener: (exitStatus?: { code?: string, signal?: string, crashReport?: string, crashReportLocation?: string }) => void): this;
    on(channel: 'minecraft-stdout', listener: (out: string) => void): this;
    on(channel: 'minecraft-stderr', listener: (err: string) => void): this;
    on(channel: 'minecraft-crash-report', listener: (report: { crashReport: string, crashReportLocation: string }) => void): this;

    on(channel: 'store-ready', listener: (store: Store<any>) => void): this;
    on(channel: 'reload', listener: () => void): this;

    on(channel: 'window-open', listener: (event: Event, windowId: string) => void): this;
    on(channel: 'window-hide', listener: (event: Event, windowId: number) => void): this;
    on(channel: 'window-close', listener: (event: Event) => void): this;

    on(channel: 'task-successed', listener: (id: string) => void): this;
    on(channel: 'task-failed', listener: (id: string) => void): this;

    on(channle: 'renderer-setup', listener: (event: Event, id: string) => void): this;
    on(channle: 'renderer-log', listener: (event: Event, text: string, ...args: string[]) => void): this;
    on(channle: 'renderer-warn', listener: (event: Event, text: string, ...args: string[]) => void): this;
    on(channle: 'renderer-error', listener: (event: Event, text: string, ...args: string[]) => void): this;
}

export declare const ipcMain: CustomEvents;
export default ipcMain;
declare module "electron" {
    interface IpcMain extends CustomEvents {
    }
}