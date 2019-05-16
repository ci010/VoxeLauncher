import { app, ipcMain } from 'electron';
import util from 'util';
import fs from 'fs';
import path from 'path';

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


    const senderIdToStreams = {};
    ipcMain.on('renderer-setup', (event, id) => {
        console.log(`Setup renderer logger for window ${id}.`);
        senderIdToStreams[event.sender.id] = fs.createWriteStream(path.resolve(root, 'logs', `renderer.${id}.log`), { encoding: 'utf-8', flags: 'w+' });
    });

    ipcMain.on('renderer-log', (event, message, ...options) => {
        const stream = senderIdToStreams[event.sender.id];
        if (stream) {
            const raw = options.length !== 0 ? util.format(message, options) : util.format(message);
            const content = `[INFO] [${new Date().toUTCString()}]: ${raw}`;
            stream.write(`${content}\n`);
        }
    });
    ipcMain.on('renderer-warn', (event, message, ...options) => {
        const stream = senderIdToStreams[event.sender.id];
        if (stream) {
            const raw = options.length !== 0 ? util.format(message, options) : util.format(message);
            const content = `[WARN] [${new Date().toUTCString()}]: ${raw}`;
            stream.write(`${content}\n`);
        }
    });
    ipcMain.on('renderer-error', (event, message, ...options) => {
        const stream = senderIdToStreams[event.sender.id];
        if (stream) {
            const raw = options.length !== 0 ? util.format(message, options) : util.format(message);
            const content = `[ERROR] [${new Date().toUTCString()}]: ${raw}`;
            stream.write(`${content}\n`);
        }
    });
}

ipcMain.on('reload', overwrite);
