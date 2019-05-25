import { app, shell } from 'electron';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import Task from 'treelike-task';
import base from './java.base';

import officialEndpoint from '../../utils/jre';
import { requireString } from '../../utils/object';

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

            const result = [];
            for (const j of arr) {
                result.push(await context.dispatch('resolve', j));
            }
            return result;
        },
        remove(context, java) {
            const newarr = context.getters.javas.filter(j => j !== java);
            if (newarr.length !== context.getters.javas.length) {
                context.commit('javas', newarr);
            }
        },
        async install(context) {
            console.log('Try auto Java from Mojang source');
            const local = path.join(context.rootState.root, 'jre', 'bin', JAVA_FILE);
            for (const j of context.state.all) {
                if (j.path === local) {
                    console.log(`Found exists installation at ${local}`);
                    return undefined;
                }
            }

            const task = Task.create('installJre', officialEndpoint);
            const handle = await context.dispatch('task/execute', task, { root: true });
            context.dispatch('task/wait', handle, { root: true }).finally(() => {
                context.dispatch('refresh');
            });
            return handle;
        },
        redirect() {
            shell.openExternal('https://www.java.com/download/');
        },
        /**
         * Test if this javapath exist and works
         */
        async resolve(context, javaPath) {
            requireString(javaPath);
            const exists = fs.existsSync(javaPath);
            if (!exists) return false;

            const resolved = context.state.all.filter(java => java.path === javaPath)[0];
            if (resolved) return resolved;

            const getJavaVersion = (str) => {
                const match = /(\d+\.\d+\.\d+)(_(\d+))?/.exec(str);
                if (match === null) return undefined;
                return match[1];
            };
            return new Promise((resolve, reject) => {
                exec(`"${javaPath}" -version`, (err, sout, serr) => {
                    const version = getJavaVersion(serr);
                    if (serr && version !== undefined) {
                        const java = {
                            path: javaPath,
                            version,
                            majorVersion: Number.parseInt(version.split('.')[0], 10),
                        };
                        context.commit('add', java);
                        resolve(java);
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

            for (const jPath of unchecked) {
                if (typeof jPath === 'string') {
                    await dispatch('resolve', jPath);
                }
            }

            return unchecked;
        },
    },
};

export default mod;
