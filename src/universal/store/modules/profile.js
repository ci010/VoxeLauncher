import uuid from 'uuid';
import { Version, GameSetting, MinecraftFolder } from 'ts-minecraft';
import paths from 'path';
import { ZipFile } from 'yazl';
import fs from 'fs-extra';
import { fitin } from '../helpers/utils';
import base from './profile.base';

function createTemplate(id, java, mcversion, author) {
    return {
        id,

        name: 'Default',

        resolution: { width: 800, height: 400, fullscreen: false },
        java,
        minMemory: 1024,
        maxMemory: 2048,
        vmOptions: [],
        mcOptions: [],

        mcversion,

        type: 'modpack',

        /**
         * Server section
         */
        servers: [],
        primary: -1,

        host: '',
        port: 25565,
        isLanServer: false,
        icon: '',

        status: {},

        /**
         * Modpack section
         */

        author,
        description: '',
        url: '',

        showLog: false,
        hideLauncher: true,

        maps: [],

        forge: {
            enabled: false,
            mods: [],
            version: '',
        },
        liteloader: {
            enabled: false,
            mods: [],
            version: '',
            settings: {},
        },
        optifine: {
            enabled: false,
            settings: {},
        },

        settings: {},

        diagnosis: {},
        errors: [],
    };
}
/**
 * @type {import('./profile').ProfileModule}
 */
const mod = {
    ...base,
    actions: {
        async load({ state, commit, dispatch, rootGetters, rootState }) {
            const dirs = await dispatch('readFolder', 'profiles', { root: true });

            if (dirs.length === 0) {
                await dispatch('createAndSelect', {});
                await dispatch('save', { mutation: 'select' });
                await dispatch('save', { mutation: 'create' });
                return;
            }

            const uuidExp = /([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}){1}/;
            await Promise.all(dirs.filter(f => uuidExp.test(f)).map(async (id) => {
                if (!await fs.exists(rootGetters.path('profiles', id, 'profile.json'))) {
                    await fs.remove(rootGetters.path('profiles', id));
                    return;
                }

                const option = await dispatch('getPersistence', { path: `profiles/${id}/profile.json` }, { root: true });
                const profile = createTemplate(
                    id,
                    rootGetters['java/default'],
                    rootGetters['version/minecraft/release'].id,
                    rootState.user.name,
                );

                fitin(profile, option);

                const opPath = rootGetters.path('profiles', id, 'options.txt');
                try {
                    const optionString = await fs.readFile(opPath, 'utf-8');
                    profile.settings = GameSetting.parseFrame(optionString);
                } catch (e) {
                    console.warn(`An error ocurrs during parse game options of ${id}.`);
                    console.warn(e);
                    profile.settings = GameSetting.getDefaultFrame();
                    await fs.writeFile(opPath, GameSetting.stringify(profile.settings));
                }

                commit('create', profile);
            }));

            if (state.all.length === 0) {
                await dispatch('createAndSelect', {});
                await dispatch('save', { mutation: 'select' });
                await dispatch('save', { mutation: 'create' });
                return;
            }

            const persis = await dispatch('getPersistence', { path: 'profiles.json' }, { root: true });
            if (persis && persis.selected) {
                commit('select', persis.selected);
            } else {
                commit('select', state[Object.keys(state)[0]].id);
            }
        },

        save(context, { mutation }) {
            if (mutation === 'profile/select') {
                return context.dispatch('setPersistence', {
                    path: 'profiles.json',
                    data: { selected: context.state.id },
                }, { root: true });
            }

            const current = context.getters.current;
            if (mutation === 'profile/editSettings') {
                return fs.writeFile(context.rootGetters.path('profiles', current.id, 'options.txt'),
                    GameSetting.stringify(current.settings));
            }

            const persistent = {};
            const mask = { status: true, settings: true, optifine: true };
            Object.keys(current).filter(k => mask[k] === undefined)
                .forEach((k) => { persistent[k] = current[k]; });

            return context.dispatch('setPersistence', {
                path: `profiles/${current.id}/profile.json`,
                data: persistent,
            }, { root: true });
        },

        async create(context, payload) {
            const profile = createTemplate(
                uuid(),
                context.rootGetters['java/default'],
                context.rootGetters['versions/minecraft/release'].id,
                context.rootState.user.name,
            );

            fitin(profile, payload);

            console.log('Create profile with option');
            console.log(profile);

            context.commit('create', profile);

            return profile.id;
        },

        async createAndSelect(context, payload) {
            const id = await context.dispatch('create', payload);
            await context.commit('select', id);
        },

        async delete(context, id) {
            if (context.state.id === id) {
                const allIds = Object.keys(context.state.all);
                if (allIds.length - 1 === 0) {
                    await context.dispatch('createAndSelect', {});
                } else {
                    context.commit('select', allIds[0]);
                }
            }
            context.commit('remove', id);
            await fs.remove(context.rootGetters.path('profiles', id));
        },

        resolveResources(context, id) {
            const profile = context.state.all[id];

            const modResources = [];
            const resourcePackResources = [];
            if (profile.forge.enabled || profile.liteloader.enabled
                || (profile.forge.mods && profile.forge.mods.length !== 0)
                || (profile.liteloader.mods && profile.liteloader.mods.length !== 0)) {
                const forgeMods = profile.forge.mods;
                const liteloaderMods = profile.liteloader.mods;

                const mods = context.rootState.resource.mods;

                const forgeModIdVersions = {};
                const liteNameVersions = {};

                Object.keys(mods).forEach((hash) => {
                    const mod = mods[hash];
                    if (mod.type === 'forge') {
                        forgeModIdVersions[`${mod.metadata.modid}:${mod.metadata.version}`] = mod.hash;
                    } else {
                        liteNameVersions[`${mod.metadata.name}:${mod.metadata.version}`] = mod.hash;
                    }
                });
                modResources.push(...forgeMods.map(key => forgeModIdVersions[key]));
                modResources.push(...liteloaderMods.map(key => liteNameVersions[key]));
            }
            if (profile.settings.resourcePacks) {
                const requiredResourcepacks = profile.settings.resourcePacks;

                const nameToId = {};
                const allPacks = context.rootState.resource.resourcepacks;
                Object.keys(allPacks).forEach((hash) => {
                    const pack = allPacks[hash];
                    nameToId[pack.name] = hash;
                });
                const requiredResources = requiredResourcepacks.map(packName => nameToId[packName]);
                resourcePackResources.push(...requiredResources);
            }

            return { mods: modResources, resourcepacks: resourcePackResources };
        },

        async export(context, { id, dest, clean }) {
            clean = typeof clean === 'boolean' ? clean : false;
            const root = context.rootState.root;
            const from = paths.join(root, 'profiles', id);
            const file = new ZipFile();
            file.outputStream.pipe(fs.createWriteStream(dest));
            await walk(from);

            const { resourcepacks, mods } = context.dispatch('resolveResources', id);

            file.addEmptyDirectory('/mods');
            file.addEmptyDirectory('/resourcepacks');

            for (const resourcepack of resourcepacks) {
                file.addFile(paths.join(root, resourcepack.hash + resourcepack.ext),
                    `/resourcepacks/${resourcepack.name}${resourcepack.ext}`);
            }

            for (const mod of mods) {
                file.addFile(paths.join(root, mod.hash + mod.ext),
                    `/mods/${mod.name}${mod.ext}`);
            }

            return new Promise((resolve, reject) => {
                file.end({}, () => {
                    resolve();
                });
            });
            async function walk(relative) {
                const real = paths.resolve(from, relative);
                const stat = await fs.stat();
                if (stat.isDirectory()) {
                    const files = await fs.readdir(real);
                    file.addEmptyDirectory(relative);
                    await Promise.all(files.map(f => walk(paths.resolve(relative, f))));
                } else if (stat.isFile()) {
                    file.addFile(real, relative);
                }
            }
        },

        async diagnose(context) {
            const { mcversion, id, java } = context.getters.current;
            const result = [];
            if (!mcversion) {
                result.push({ id: 'missingVersion', autofix: false });
            } else {
                const location = context.rootState.root;
                const versionDiagnosis = await Version.diagnose(mcversion, location);

                for (const key of ['missingVersionJar', 'missingAssetsIndex']) {
                    if (versionDiagnosis[key]) { result.push({ id: key, autofix: true }); }
                }
                if (versionDiagnosis.missingVersionJson !== '') {
                    result.push({
                        id: 'missingVersionJson',
                        arguments: { version: versionDiagnosis.missingVersionJson },
                        autofix: true,
                    });
                }
                if (versionDiagnosis.missingLibraries.length !== 0) {
                    result.push({
                        id: 'missingLibraries',
                        arguments: { count: versionDiagnosis.missingLibraries.length },
                        autofix: true,
                    });
                }
                const missingAssets = Object.keys(versionDiagnosis.missingAssets);
                if (missingAssets.length !== 0) {
                    result.push({
                        id: 'missingAssets',
                        arguments: { count: missingAssets.length },
                        autofix: true,
                    });
                }
                context.commit('diagnose', versionDiagnosis);
            }
            if (!java) {
                result.push({
                    id: 'missingJava',
                    options: [{
                        id: 'autoDowanload',
                        autofix: true,
                    }, {
                        id: 'maunalDownload',
                    }, {
                        id: 'selectJava',
                    }],
                });
            }

            context.commit('errors', result);
        },

        async fix(context) {
            const profile = context.state.all[context.state.id];
            const mcversion = profile.mcversion;
            const location = context.rootState.root;
            if (profile.diagnosis) {
                const diagnosis = profile.diagnosis;
                if (mcversion !== '') {
                    if (diagnosis.missingVersionJson || diagnosis.missingVersionJar) {
                        const versionMeta = context.rootState.version.minecraft.versions[mcversion];
                        const task = Version.installTask('client', versionMeta, location);
                        try {
                            await context.dispatch('task/execute', task, { root: true });
                        } catch (e) {
                            console.error('Error during fixing profile');
                            console.error(e);
                        }
                        await context.dispatch('diagnose');
                    }
                    if (diagnosis.missingAssetsIndex
                        || Object.keys(diagnosis.missingAssets).length !== 0
                        || diagnosis.missingLibraries.length !== 0) {
                        const resolvedVersion = await Version.parse(location, mcversion);
                        const task = Version.checkDependenciesTask(resolvedVersion, location);
                        try {
                            await context.dispatch('task/execute', task, { root: true });
                        } catch (e) {
                            console.error('Error during fixing profile');
                            console.error(e);
                        }
                        await context.dispatch('diagnose');
                    }
                }
            }
        },
    },
};

export default mod;
