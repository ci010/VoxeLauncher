import { app } from 'electron';
import util from 'util';
import fs from 'fs';
import path from 'path';
import { ipcMain } from './ipc';

let firstRun = true;

function overwrite() {
    const { log, error, warn } = console;

    const root = app.getPath('userData');
    try {
        fs.mkdirSync(path.resolve(root, 'logs'));
    } catch (e) {
        if (e.code !== 'EEXIST') {
            throw e;
        }
    }

    console.log(path.resolve(root, 'logs', 'main.log'));
    const outstream = fs.createWriteStream(path.resolve(root, 'logs', 'main.log'), { encoding: 'utf-8', flags: 'w+' });
    /**
     * @param {any} message
     * @param {any[]} options
     */
    console.log = (message, ...options) => {
        const raw = options.length !== 0 ? util.format(message, options) : util.format(message);
        const content = `[INFO] [${new Date().toUTCString()}]: ${raw}`;
        log(content);
        outstream.write(`${content}\n`);
    };
    /**
     * @param {any} message
     * @param {any[]} options
     */
    console.warn = (message, ...options) => {
        const raw = options.length !== 0 ? util.format(message, options) : util.format(message);
        const content = `[WARN] [${new Date().toUTCString()}]: ${raw}`;
        warn(content);
        outstream.write(`${content}\n`);
    };
    /**
     * @param {any} message
     * @param {any[]} options
     */
    console.error = (message, ...options) => {
        const raw = options.length !== 0 ? util.format(message, options) : util.format(message);
        const content = `[ERROR] [${new Date().toUTCString()}]: ${raw}`;
        error(content);
        outstream.write(`${content}\n`);
    };

    if (firstRun) {
        const levels = ['INFO', 'WARN', 'ERROR'];
        ipcMain.on('browser-window-setup', (window, name) => {
            const loggerPath = path.resolve(root, 'logs', `renderer.${name}.log`);
            console.log(`Setup renderer logger for window ${name} to ${loggerPath}.`);
            const stream = fs.createWriteStream(loggerPath, { encoding: 'utf-8', flags: 'w+' });
            window.webContents.on('console-message', (e, level, message, line, id) => {
                stream.write(`[${levels[level]}] [${id}] ${message}\n`);
            });
            window.once('close', () => {
                stream.close();
            });
        });
        firstRun = false;
    }
}

ipcMain.on('reload', overwrite);
