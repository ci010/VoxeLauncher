import { CustomEvents } from './ipc';
import { BrowserWindow, BrowserWindowConstructorOptions, Tray, Dock } from 'electron';
import { Repo } from '../universal/store/store';
interface Instance {
    requestFocus(): void
    dispose(): void
    listeners: { [channel: string]: Function[] }
}
interface Hook {
    requestFocus(): void
    dispose(): void
}
interface Context {
    createWindow(url: string, option: BrowserWindowConstructorOptions): BrowserWindow;
    ipcMain: CustomEvents,
    configTray(func: (tray: Tray) => void): this;
    configDock(func: (dock: Dock) => void): this;
}
type Setup = (context: Context, store: Repo) => Hook;