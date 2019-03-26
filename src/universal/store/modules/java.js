import { net, app } from 'electron';
import os from 'os';
import path from 'path';
import Vue from 'vue';
import fs from 'fs-extra';
import download from 'ts-minecraft/dist/libs/utils/download';
import Zip from 'jszip';
import { exec } from 'child_process';
import { Module } from 'vuex';

// https://api.github.com/repos/Indexyz/ojrebuild/releases
async function installJre() {
    const info = await new Promise((resolve, reject) => {
        const req = net.request({
            method: 'GET',
            protocol: 'https:',
            hostname: 'api.github.com',
            path: '/repos/Indexyz/ojrebuild/releases',
        });
        req.setHeader('User-Agent', 'ILauncher');
        req.end();
        let infojson = '';
        req.on('response', (response) => {
            response.on('data', (data) => {
                infojson += data.toString();
            });
            response.on('end', () => {
                resolve(JSON.parse(infojson));
            });
            response.on('error', (e) => {
                console.error(`${response.headers}`);
            });
        });
        req.on('error', (err) => {
            reject(err);
        });
    });
    const latest = info[0];
    let buildSystemId;
    let arch;
    switch (os.arch()) {
        case 'x86':
        case 'x32':
            arch = 'x86';
            break;
        case 'x64':
            arch = 'x86_64';
            break;
        default:
            arch = 'x86';
    }
    switch (os.platform()) {
        case 'darwin': break;
        case 'win32':
            buildSystemId = 'windows';
            break;
        case 'linux':
            buildSystemId = 'el6_9';
            break;
        default:
            buildSystemId = '';
    }
    if (!buildSystemId) throw new Error(`Not supporting system ${os.platform()}`);
    if (!arch) throw new Error(`Not supporting arch ${os.arch()}`);
    const downURL = latest.assets.map(ass => ass.browser_download_url)
        .filter((ass) => {
            const arr = ass.split('.');
            return arr[arr.length - 2] === arch; // && sys === arr[arr.length - 3]
        })[0];
    const splt = downURL.split('/');
    const tempFileLoc = path.join(app.getPath('temp'), splt[splt.length - 1]);
    // console.log('start download')
    // console.log(tempFileLoc);
    await fs.ensureFile(tempFileLoc);
    // console.log(`download url ${downURL}`)
    await download(downURL, tempFileLoc);
    const jreRoot = path.join(app.getPath('userData'), 'jre');
    // console.log(`jreRoot ${jreRoot}`)
    const zip = await new Zip().loadAsync(await fs.readFile(tempFileLoc));
    const arr = [];
    zip.forEach((name, entry) => {
        const target = path.resolve(jreRoot, name);
        arr.push(entry.async('nodebuffer')
            .then(buf => fs.ensureFile(target).then(() => buf))
            .then(buf => fs.writeFile(target, buf)));
    });
    await Promise.all(arr);
    // console.log('deleting temp')
    await fs.unlink(tempFileLoc);
}

export default {
    namespaced: true,
    state: {
        all: [],
        default: '',
    },
    getters: {
        all: state => state.all,
        default: state => state.default,
        error(state) {
            const errors = [];
            if (state.all.length === 0) {
                errors.push('error.installJava');
            }
            return errors;
        },
    },
    mutations: {
        add(state, java) {
            if (java instanceof Array) {
                state.all.push(...java);
            } else {
                state.all.push(java);
            }
            if (!state.default) state.default = state.all[0];
        },
        remove(state, java) {
            const index = state.all.indexOf(java);
            if (index !== -1) Vue.delete(state.all, index);
            if (state.all.length === 0) state.default = '';
        },
        default(state, def) { state.default = def; },
    },
    actions: {
        load(context) {
            return context.dispatch('refresh');
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
            const file = os.platform() === 'win32' ? 'javaw.exe' : 'java';
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
            const set = {};
            all.filter(p => fs.existsSync(p)).forEach((p) => { set[p] = 0; });
            all = [];
            for (const p of Object.keys(set)) {
                if (await dispatch('test', p)) {
                    all.push(p);
                }
            }

            const local = path.join(app.getPath('userData'), 'jre', 'bin', 'javaw.exe');
            if (fs.existsSync(local)) all.unshift(local);

            const result = all.filter(p => state.all.indexOf(p) === -1);
            if (result.length !== 0) commit('add', result);

            return all;
        },
        async download(context) {
            const arr = await context.dispatch('refresh');
            const local = path.join(app.getPath('userData'), 'jre', 'bin', 'javaw.exe');
            if (fs.existsSync(local)) arr.unshift(local);
            if (arr.length === 0) {
                await installJre();
                if (fs.existsSync(local)) arr.unshift(local);
            }
            return arr;
        },
    },
};
