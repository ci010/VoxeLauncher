import { app, shell } from 'electron';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import Task from 'treelike-task';
import base from './java.base';

import officialEndpoint from '../helpers/jre';

const JAVA_FILE = os.platform() === 'win32' ? 'javaw.exe' : 'java';

/**
 * @type { import("./java").JavaModule }
 */
const mod = {
    ...base,
    actions: {
        async load(context) {
            await context.dispatch('refresh');
        },
        async add(context, java) {
            const arr = java instanceof Array ? java : [java];

            const valids = [];
            for (const j of arr) {
                const resolved = await context.dispatch('resolve', j);
                if (resolved && !context.state.all.some(j => j.path === j)) {
                    valids.push(resolved);
                }
            }
            if (valids.length !== 0) {
                context.commit('add', valids);
                return true;
            }
            return false;
        },
        remove(context, java) {
            const newarr = context.getters.javas.filter(j => j !== java);
            if (newarr.length !== context.getters.javas.length) {
                context.commit('javas', newarr);
            }
        },
        async install(context) {
            const local = path.join(app.getPath('userData'), 'jre', 'bin', JAVA_FILE);
            for (const j of context.state.all) {
                if (j.path === local) {
                    return;
                }
            }
            const task = Task.create('installJre', officialEndpoint);
            const version = await context.dispatch('task/exectute', task, { root: true });
            if (version === '') {
                // TODO: handle not support
            }
        },
        redirect(context) {
            shell.openExternal('https://www.java.com/download/');
        },
        /**
         * Test if this javapath exist and works
         */
        async resolve(context, javaPath) {
            const exists = fs.existsSync(javaPath);
            if (!exists) return false;
            const getJavaVersion = (str) => {
                const match = /(\d+\.\d+\.\d+)(_(\d+))?/.exec(str);
                if (match === null) return undefined;
                return match[1];
            };
            return new Promise((resolve, reject) => {
                exec(`"${javaPath}" -version`, (err, sout, serr) => {
                    const version = getJavaVersion(serr);
                    if (serr && version !== undefined) {
                        resolve({
                            path: javaPath,
                            version,
                            majorVersion: Number.parseInt(version.split('.')[0], 10),
                        });
                    } else {
                        resolve(undefined);
                    }
                });
            });
        },
        /**
         * scan local java locations and cache
         */
        async refresh({ state, dispatch, commit }) {
            const unchecked = new Set();

            unchecked.add(path.join(app.getPath('userData'), 'jre', 'bin', JAVA_FILE));
            process.env.PATH.split(path.delimiter).forEach(p => unchecked.add(path.join(p, JAVA_FILE)));
            if (process.env.JAVA_HOME) unchecked.add(path.join(process.env.JAVA_HOME, 'bin', JAVA_FILE));

            const which = () => new Promise((resolve, reject) => {
                exec('which java', (error, stdout, stderr) => {
                    resolve(stdout.replace('\n', ''));
                });
            });

            if (os.platform() === 'win32') {
                const out = await new Promise((resolve, reject) => {
                    exec('REG QUERY HKEY_LOCAL_MACHINE\\Software\\JavaSoft\\ /s /v JavaHome', (error, stdout, stderr) => {
                        if (!stdout) resolve([]);
                        resolve(stdout.split(os.EOL).map(item => item.replace(/[\r\n]/g, ''))
                            .filter(item => item != null && item !== undefined)
                            .filter(item => item[0] === ' ')
                            .map(item => `${item.split('    ')[3]}\\bin\\javaw.exe`));
                    });
                });
                unchecked.add(...out);
            } else if (os.platform() === 'darwin') {
                unchecked.add('/Library/Internet Plug-Ins/JavaAppletPlugin.plugin/Contents/Home/bin/java');
                unchecked.add(await which());
            } else {
                unchecked.add(await which());
            }

            state.all.forEach(j => unchecked.add(j.path));

            const result = [];
            for (const jPath of unchecked) {
                const version = await dispatch('resolve', jPath);
                if (version) result.push(version);
            }

            if (result.length !== 0) commit('add', result);

            return unchecked;
        },
    },
};

export default mod;
