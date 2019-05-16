import { app } from 'electron';

process.on('SIGINT', () => {
    app.quit();
});

const devMod = process.env.NODE_ENV === 'development';
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (!devMod) {
    global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\');
}

/* eslint-disable */
if (!app.requestSingleInstanceLock()) {
    app.quit();
}

import './logger';
import './boot';
import './autoUpdate';
export { commit, dispatch } from './store';
import './windowsManager';
import './trayManager';

/* eslint-enable */
