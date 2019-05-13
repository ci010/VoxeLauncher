import { Store } from "vuex";
import { Event } from "electron";

declare module "electron" {
    interface IpcMain {
        on(channel: 'locale-changed', listener: () => void): this;

        on(channel: 'minecraft-start', listener: () => void): this;
        on(channel: 'minecraft-exit', listener: (exitStatus?: { code?: string, signal?: string, crashReport?: string, crashReportLocation?: string }) => void): this;
        on(channel: 'minecraft-stdout', listener: (out: string) => void): this;
        on(channel: 'minecraft-stderr', listener: (err: string) => void): this;
        on(channel: 'minecraft-crash-report', listener: (report: { crashReport: string, crashReportLocation: string }) => void): this;

        on(channel: 'store-ready', listener: (store: Store<any>) => void): this;
        on(channel: 'reload', listener: () => void): this;

        on(channel: 'window-open', listener: (event: Event, windowId: string) => void);
        on(channel: 'window-close', listener: (event: Event) => void);
    }
}