import { MinecraftFolder, Launcher } from 'ts-minecraft';
import paths from 'path';
import { ipcMain } from 'electron';

/**
 * @param {{ message: string; type: string; }} e
 */
function onerror(e) {
    if (e.message.startsWith('Cannot find version ') || e.message.startsWith('No version file for ') || e.message.startsWith('No version jar for ')) {
        e.type = 'missing.version';
    } else if (e.message === 'Missing library') {
        e.type = 'missing.libraries';
    } else if (e.message === 'Missing asset!') {
        e.type = 'missing.assets';
    } else if (e.message === 'Missing mainClass' || e.message === 'Missing minecraftArguments') {
        e.type = 'illegal.version.json';
    }
    return e;
}

/**
 * @type { import('./launch').LauncherModule }
 */
const mod = {
    actions: {
        async launch(context) {
            /**
             * current selected profile
             * @type { import('./profile').ProfileModule.Profile }
             */
            const profile = context.rootGetters.selectedProfile;
            const user = context.rootState.user;
            if (!profile) return Promise.reject(new Error('launch.profile.empty'));
            if (user.accessToken === '' || user.name === '' || user.id === '') return Promise.reject(new Error('launch.auth.illegal'));

            const debug = profile.showLog;
            const minecraftFolder = new MinecraftFolder(paths.join(context.rootState.root, 'profiles', profile.id));

            /**
             * real version name
             */
            const version = await context.dispatch('resolveVersion', {
                folder: '',
                minecraft: profile.mcversion,
                forge: profile.forge.enabled ? profile.forge.version : '',
                liteloader: profile.liteloader.enabled ? profile.liteloader.version : '',
            });

            console.log(`Chooose ${version} version.`);

            const java = profile.java || context.rootGetters.defaultJava;
            /**
             * Build launch condition
             * @type {Launcher.Option}
             */
            const option = {
                auth: {
                    selectedProfile: {
                        id: user.id,
                        name: user.name,
                    },
                    accessToken: user.accessToken,
                    userType: user.userType,
                    properties: user.properties,
                },
                gamePath: minecraftFolder.root,
                resourcePath: context.rootState.root,
                javaPath: java.path,
                minMemory: profile.minMemory || 1024,
                maxMemory: profile.maxMemory || 1024,
                version,
            };
            if (profile.type === 'server') {
                option.server = { ip: profile.server.host, port: profile.server.port };
            }

            const { mods, resourcepacks } = await context.dispatch('resolveProfileResources', context.rootState.profile.id);

            try {
                await context.dispatch('deployResources', {
                    resources: resourcepacks,
                    minecraft: option.gamePath,
                });
            } catch (e) {
                console.error('Cannot deploy resource packs');
                console.error(e);
            }
            try {
                await context.dispatch('deployResources', {
                    resources: mods,
                    minecraft: option.gamePath,
                });
            } catch (e) {
                console.error('Cannot deploy mods');
                console.error(e);
            }

            console.log(JSON.stringify(option));

            // Launch
            return Launcher.launch(option).then((process) => {
                let crashReport = '';
                let crashReportLocation = '';
                ipcMain.emit('minecraft-start', debug);
                process.on('error', (err) => {
                    console.log(err);
                });
                process.on('exit', (code, signal) => {
                    console.log(`exit: ${code}, signal: ${signal}`);
                    if (code !== 0 && (crashReport || crashReportLocation)) {
                        ipcMain.emit('minecraft-crash-report', {
                            crashReport,
                            crashReportLocation,
                        });
                        ipcMain.emit('minecraft-exit', {
                            code,
                            signal,
                            crashReport,
                            crashReportLocation,
                        });
                    } else {
                        ipcMain.emit('minecraft-exit', { code, signal });
                    }
                });
                process.stdout.on('data', (s) => {
                    const string = s.toString();
                    if (string.indexOf('---- Minecraft Crash Report ----') !== -1) {
                        crashReport = string;
                    } else if (string.indexOf('Crash report saved to:') !== -1) {
                        crashReportLocation = string.substring(string.indexOf('Crash report saved to:') + 'Crash report saved to: #@!@# '.length);
                    }
                    ipcMain.emit('minecraft-stdout', string);
                });
                process.stderr.on('data', (s) => {
                    ipcMain.emit('minecraft-stderr', s.toString());
                });
            }).catch((e) => {
                throw (e);
            });
        },
    },
};

export default mod;
