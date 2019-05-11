import { app, ipcMain } from 'electron';
import util from 'util';
import fs from 'fs';
import path from 'path';

function overwrite() {
    const { log, error, warn } = console;
    const root = app.getPath('userData');

    const outstream = fs.createWriteStream(path.resolve(root, 'main.log'), { encoding: 'utf-8', flags: 'w+' });
    console.log = (message, ...options) => {
        const raw = options.length !== 0 ? util.format(message, options) : util.format(message);
        const content = `[INFO] [${new Date().toUTCString()}]: ${raw}`;
        log(content);
        outstream.write(`${content}\n`);
    };
    console.warn = (message, ...options) => {
        const raw = options.length !== 0 ? util.format(message, options) : util.format(message);
        const content = `[WARN] [${new Date().toUTCString()}]: ${raw}`;
        warn(content);
        outstream.write(`${content}\n`);
    };
    console.error = (message, ...options) => {
        const raw = options.length !== 0 ? util.format(message, options) : util.format(message);
        const content = `[ERROR] [${new Date().toUTCString()}]: ${raw}`;
        error(content);
        outstream.write(`${content}\n`);
    };
}

ipcMain.on('reload', overwrite);
