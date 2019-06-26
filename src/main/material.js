
import { resolve } from 'path';
import { Menu } from 'electron';

/**
 * @type {import('./setup').Setup}
 */
export default function setup(context, store) {
    /**
     * @type { import('electron').BrowserWindow? }
     */
    let mainRef;
    /**
    * @type { import('electron').BrowserWindow? }
    */
    let loggerRef;

    function createMainWindow() {
        mainRef = context.createWindow('main.html', {
            title: 'VoxeLauncher',
            width: 770,
            height: 580,
            resizable: false,
            frame: false,
            transparent: true,
            hasShadow: false,
            maximizable: false,
            icon: resolve(__static, 'apple-touch-icon.png'),
            webPreferences: {
                nodeIntegration: true,
            },
        });
        mainRef.show();
        context.configDock((dock) => {
            dock.setMenu(Menu.buildFromTemplate([
            ]));
        });
    }
    function createLoggerWindow() {
        loggerRef = context.createWindow('logger.html', {
            title: 'VoxeLauncher',
            width: 770,
            height: 580,
            frame: false,
            transparent: true,
            hasShadow: false,
            maximizable: false,
            icon: resolve(__static, 'apple-touch-icon.png'),
            webPreferences: {
                nodeIntegration: true,
            },
        });
    }
    context.configTray((tray) => {
        tray.on('click', () => {
            if (loggerRef && !loggerRef.isFocused()) {
                loggerRef.focus();
            } else if (mainRef && !mainRef.isFocused()) {
                mainRef.focus();
            }
        })
            .on('double-click', () => {
                if (loggerRef) {
                    if (loggerRef.isVisible()) loggerRef.hide();
                    else loggerRef.show();
                } else if (mainRef) {
                    if (mainRef.isVisible()) mainRef.hide();
                    else mainRef.show();
                }
            });
    });
    context.configDock((dock) => {
    });

    context.ipcMain
        .on('window-hide', (event, id) => {
            id = id || event.sender.id;
            if (loggerRef && loggerRef.webContents.id === id) {
                loggerRef.hide();
            }
            if (mainRef && mainRef.webContents.id === id) {
                mainRef.hide();
            }
        })
        .on('window-open', (event, id) => {
            switch (id) {
                case 'profile': createMainWindow(); break;
                default:
            }
        })
        .on('minecraft-exit', () => {
            const { hideLauncher } = store.getters.selectedProfile;
            if (hideLauncher) {
                if (mainRef) {
                    mainRef.show();
                }
            }
        })
        .on('task-successed', (id) => {
            if (mainRef) {
                mainRef.webContents.send('task-successed', id);
            }
        })
        .on('task-failed', (id) => {
            if (mainRef) {
                mainRef.webContents.send('task-failed', id);
            }
        })
        .on('minecraft-start', () => {
        })
        .on('minecraft-exit', (status) => {
            if (mainRef) {
                mainRef.webContents.send('minecraft-exit', status);
            }
            if (loggerRef) {
                loggerRef.close();
                loggerRef = null;
            }
        })
        .on('minecraft-window-ready', () => {
            if (mainRef && mainRef.isVisible()) {
                mainRef.webContents.send('minecraft-window-ready');
                const { hideLauncher } = store.getters.selectedProfile;
                if (hideLauncher) {
                    mainRef.hide();
                }
            }

            if (loggerRef === undefined && store.getters.selectedProfile.showLog) {
                createLoggerWindow();
            }

            context.configDock((dock) => {
                dock.setMenu(Menu.buildFromTemplate([
                    {
                        label: 'Show Log',
                        type: 'normal',
                        click() {
                            if (!loggerRef) {
                                createLoggerWindow();
                            } else if (!loggerRef.isVisible()) {
                                loggerRef.show();
                            } else {
                                loggerRef.focus();
                            }
                        },
                    },
                ]));
            });
        })
        .on('minecraft-stdout', (out) => {
            if (loggerRef) {
                loggerRef.webContents.send('minecraft-stdout', out);
            }
        })
        .on('minecraft-stderr', (out) => {
            if (loggerRef) {
                loggerRef.webContents.send('minecraft-stderr', out);
            }
        });

    createMainWindow();

    return {
        requestFocus() {
            if (mainRef) {
                mainRef.focus();
            } else if (loggerRef) {
                loggerRef.focus();
            }
        },
        dispose() {
            if (mainRef) {
                mainRef.close();
                mainRef = null;
            }
            if (loggerRef) {
                loggerRef.close();
                loggerRef = null;
            }
        },
    };
}
