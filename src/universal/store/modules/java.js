import { app } from 'electron';
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { exec } from 'child_process';
import base from './java.base';

import installJreTask from '../helpers/jre';

const file = os.platform() === 'win32' ? 'javaw.exe' : 'java';

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
            const valid = await context.dispatch('test', java);
            if (valid) context.commit('javas', java);
            return valid;
        },
        remove(context, java) {
            const newarr = context.getters.javas.filter(j => j !== java);
            if (newarr.length !== context.getters.javas.length) {
                context.commit('javas', newarr);
            }
        },
        async install(context) {
            let arch;
            let system;
            switch (os.arch()) {
                case 'x86':
                case 'x32':
                    arch = '32';
                    break;
                case 'x64':
                    arch = '64';
                    break;
                default:
                    arch = '32';
            }
            switch (os.platform()) {
                case 'darwin':
                    system = 'osx';
                    break;
                case 'win32':
                    system = 'windows';
                    break;
                case 'linux':
                    system = 'linux';
                    break;
                default:
            }
            if (!arch || !system) {
                throw new Error('Unsupported System!');
            }
            if (system !== 'linux') {
                const info = await context.dispatch('mojang/fetchLauncherInfo');
                const jInfo = info[system][arch];
                if (jInfo) {
                    const url = jInfo.jre.url;
                }
            }
        },
        /**
         * Test if this javapath exist and works
         */
        async test(context, javaPath) {
            const exists = await fs.existsSync(javaPath);
            if (!exists) return false;
            return new Promise((resolve, reject) => {
                exec(`"${javaPath}" -version`, (err, sout, serr) => {
                    resolve(serr && serr.indexOf('java version') !== -1);
                });
            });
        },
        /**
         * scan local java locations and cache
         */
        async refresh({ state, dispatch, commit }) {
            let all = [];
            const spliter = path.delimiter;
            process.env.PATH.split(spliter).forEach(p => all.push(path.join(p, 'bin', file), path.join(p, file)));

            const which = () => new Promise((resolve, reject) => {
                exec('which java', (error, stdout, stderr) => {
                    resolve(stdout.replace('\n', ''));
                });
            });

            if (process.env.JAVA_HOME) all.push(path.join(process.env.JAVA_HOME, 'bin', file));
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
                all.push(...out);
            } else if (os.platform() === 'darwin') {
                all.push('/Library/Internet Plug-Ins/JavaAppletPlugin.plugin/Contents/Home/bin/java');
                all.push(await which());
            } else {
                all.push(await which());
            }

            // dedup
            const set = {};
            all.filter(p => fs.existsSync(p)).forEach((p) => { set[p] = 0; });
            all = [];
            for (const p of Object.keys(set)) {
                if (await dispatch('test', p)) {
                    all.push(p);
                }
            }

            const local = path.join(app.getPath('userData'), 'jre', 'bin', file);
            if (fs.existsSync(local)) all.unshift(local);

            const result = all.filter(p => state.all.indexOf(p) === -1);
            if (result.length !== 0) commit('add', result);

            return all;
        },
    },
};

export default mod;
