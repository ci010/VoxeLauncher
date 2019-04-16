import fs from 'fs-extra';
import { ActionContext } from 'vuex';
import { MinecraftFolder, Launcher, Version } from 'ts-minecraft';
import paths from 'path';
import { ipcMain } from 'electron';

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
 * 
 * @param {string} id 
 * @param {MinecraftFolder} location 
 * @param {string} mcTemp 
 * @param {string} forgeTemp 
 * @param {string} liteTemp 
 */
async function mixinVersion(id, location, forgeTemp, liteTemp) {
    console.log(`mixin version from ${forgeTemp} ${liteTemp}`);
    /**
    * @type {Version.Raw}
    */
    const forgeJson = await fs.readFile(location.getVersionJson(forgeTemp));
    /**
    * @type {Version.Raw}
    */
    const liteJson = await fs.readFile(location.getVersionJson(liteTemp));

    const profile = {
        id,
        time: liteJson.time,
        releaseTime: liteJson.releaseTime,
        type: liteJson.type,
        inheritsFrom: forgeTemp,
        libraries: liteJson.libraries,
        mainClass: liteJson.mainClass,
        jar: liteJson.jar,
    };
    const args = liteJson.arguments ? liteJson.arguments.game : liteJson.minecraftArguments.split(' ');
    const forgeArgs = forgeJson.arguments ? forgeJson.arguments.game : forgeJson.minecraftArguments.split(' ');
    let tweakClass;
    for (let i = 0; i < args.length; i += 1) {
        const a = args[i];
        if (a === '--tweakClass') tweakClass = args[i + 1];
    }
    if (!tweakClass) {
        const err = {
            type: 'CorruptedVersionJson',
            reason: 'MissingTweakClass',
            version: liteTemp,
        };
        throw err;
    }

    if (liteJson.arguments) {
        profile.arguments = {
            game: ['--tweakClass', tweakClass, ...forgeArgs],
            jvm: [...liteJson.arguments.jvm],
        };
    } else {
        forgeArgs.unshift(tweakClass);
        forgeArgs.unshift('--tweakClass');
        profile.minecraftArguments = forgeArgs.join(' ');
    }

    const json = location.getVersionJson(id);
    await fs.ensureFile(json);
    await fs.writeFile(json, JSON.stringify(profile, undefined, 4));
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
            const profile = context.rootGetters['profile/current'];
            const user = context.rootState.user;
            if (!profile) return Promise.reject('launch.profile.empty');
            if (user.accessToken === '' || user.name === '' || user.id === '') return Promise.reject('launch.auth.illegal');

            const debug = profile.logWindow;
            const minecraftFolder = new MinecraftFolder(paths.join(context.rootState.root, 'profiles', profile.id));

            /**
             * Handle version
             * @param {string} mc
             */
            const getExpect = (mc, forge, lite) => {
                let expectedId = mc;
                if (forge) expectedId += `-forge${mc}-${forge}`;
                if (lite) expectedId += `-liteloader${lite}`;
                return expectedId;
            };
            const localVersions = context.rootState.versions.local;
            /**
             * @typedef {import('./versions').VersionModule.LocalVersion} LocalVersion
             * cache the mcversion -> forge/lite/mc versions real id 
             * @type {{[mcversion: string] : { forge: LocalVersion[], liteloader: LocalVersion[] }}}
             */
            const mcverMap = {};
            /**
             * cache the map that expected id -> real id
             * @type {{[expectId: string]: string}}
             */
            const expectVersionMap = {};
            /**
             * cache local version into map
             */
            localVersions.forEach((ver) => {
                if (!mcverMap[ver.minecraft]) {
                    mcverMap[ver.minecraft] = {
                        forge: [],
                        liteloader: [],
                    };
                }
                const container = mcverMap[ver.minecraft];
                if (ver.forge) container.forge.push(ver);
                if (ver.liteloader) container.liteloader.push(ver);
                if (!ver.forge && ver.liteloader) container.minecraft = ver.id;
                expectVersionMap[getExpect(ver.minecraft, ver.forge, ver.liteloader)] = ver.id;
            });

            const mcversion = profile.mcversion;
            if (!mcversion) {
                const err = {
                    type: 'NoSelectedVersion',
                };
                throw err;
            }

            const forgeVersion = profile.forge.enabled ? profile.forge.version : undefined;
            const liteVersion = profile.liteloader.enabled ? profile.liteloader.version : undefined;

            const expectId = getExpect(mcversion, forgeVersion, liteVersion);
            const targetVersionId = expectVersionMap[expectId];
            /**
             * real version name
             * @type {string}
             */
            let version;

            if (!targetVersionId) {
                console.log(`try to generate version dynamic, ${expectId}`);
                /**
                 * if target version not exist, try to generate version dynamicly
                 */
                const versionContainer = mcverMap[mcversion];
                if (!versionContainer) {
                    const err = {
                        type: 'MissingMinecraftVersion',
                        version: mcversion,
                    };
                    throw err;
                }
                let forgeTemplate;
                let liteTemplate;
                if (forgeVersion) {
                    const forges = versionContainer.forge;
                    for (const f of forges) {
                        if (f.forge === forgeVersion) {
                            forgeTemplate = f.id;
                            break;
                        }
                    }
                    if (!forgeTemplate) {
                        const err = {
                            type: 'MissingForgeVersion',
                            version: forgeVersion,
                        };
                        throw err;
                    }
                }
                if (liteVersion) {
                    const lites = versionContainer.liteloader;
                    for (const v of lites) {
                        if (v.liteloader === liteVersion) {
                            liteTemplate = v.id;
                            break;
                        }
                    }
                    if (!liteTemplate) {
                        const err = {
                            type: 'MissingLiteloaderVersion',
                            version: liteVersion,
                        };
                        throw err;
                    }
                }
                await mixinVersion(expectId, minecraftFolder, forgeTemplate, liteTemplate);
                version = expectId;
            } else {
                version = targetVersionId;
            }

            /**
             * Handle profile error
             */
            // const errors = context.getters[`profiles/${profileId}/errors`]
            // if (errors && errors.length !== 0) return Promise.reject(errors[0])
            const java = profile.java || context.rootGetters['java/default'];
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
                option.server = { ip: profile.host, port: profile.port };
            }

            const { mods, resourcepacks } = context.dispatch('profile/resolveResources', context.rootState.profile.id);

            try {
                await context.dispatch('resource/deploy', {
                    resources: resourcepacks,
                    minecraft: option.gamePath,
                });
            } catch (e) {
                console.error('Cannot deploy resource packs');
                console.error(e);
            }
            try {
                await context.dispatch('resource/deploy', {
                    resources: mods,
                    minecraft: option.gamePath,
                });
            } catch (e) {
                console.error('Cannot deploy mods');
                console.error(e);
            }

            console.log(JSON.stringify(option));

            /**
             * Launch
             */
            return Launcher.launch(option).then((process) => {
                ipcMain.emit('minecraft-start', debug);
                process.on('error', (err) => {
                    console.log(err);
                });
                process.on('exit', (code, signal) => {
                    console.log(`exit: ${code}, signal: ${signal}`);
                    ipcMain.emit('minecraft-exit');
                });
                process.stdout.on('data', (s) => {
                    console.log(s.toString());
                    ipcMain.emit('minecraft-stdout', s.toString());
                });
                process.stderr.on('data', (s) => {
                    console.log(s.toString());
                    ipcMain.emit('minecraft-stderr', s.toString());
                });
            }).catch((e) => {
                throw (e);
            });
        },
    },
};

export default mod;
