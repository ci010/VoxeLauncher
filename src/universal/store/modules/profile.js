import uuid from 'uuid';
import { Version } from 'ts-minecraft';
import path from 'path';
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

        logWindow: false,

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
    };
}
/**
 * @type {import('./profile').ProfileModule}
 */
const mod = {
    ...base,
    actions: {
        async load(context) {
            const dirs = await context.dispatch('readFolder', 'profiles', { root: true });

            if (dirs.length === 0) {
                await context.dispatch('createAndSelect', {});
                await context.dispatch('save', { mutation: 'select' });
                await context.dispatch('save', { mutation: 'create' });
                return;
            }

            await Promise.all(dirs.map(async (id) => {
                const exist = await context.dispatch('exists', `profiles/${id}/profile.json`, { root: true });
                if (!exist) {
                    await context.dispatch('delete', `profiles/${id}`, { root: true });
                    return;
                }
                const option = await context.dispatch('read', { path: `profiles/${id}/profile.json`, type: 'json' }, { root: true });

                const profile = createTemplate(
                    id,
                    context.rootGetters['java/default'],
                    context.rootGetters['versions/minecraft/release'].id,
                    context.rootState.user.name,
                );

                fitin(profile, option);
                context.commit('create', profile);
            }));

            if (context.state.all.length === 0) {
                await context.dispatch('createAndSelect', {});
                await context.dispatch('save', { mutation: 'select' });
                await context.dispatch('save', { mutation: 'create' });
                return;
            }

            const profiles = await context.dispatch('read', {
                path: 'profiles.json',
                type: 'json',
                fallback: {
                    selected: context.state[Object.keys(context.state)[0]].id,
                },
            }, { root: true });
            context.commit('select', profiles.selected);
        },

        save(context, { mutation }) {
            if (mutation === 'select') {
                return context.dispatch('write', {
                    path: 'profiles.json',
                    data: ({ selected: context.state.id }),
                }, { root: true });
            }

            const current = context.getters.current;
            const persistent = {};
            const mask = { status: true, settings: true, optifine: true };
            Object.keys(current).filter(k => mask[k] === undefined)
                .forEach((k) => { persistent[k] = current[k]; });

            return context.dispatch('write', {
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
            context.commit('remove', id);
            await context.dispatch('delete', `profiles/${id}`, { root: true });
            if (context.state.id === id) {
                context.dispatch('createAndSelect', {});
            }
        },

        async diagnose(context) {
            const { mcversion, id } = context.getters.current;
            const location = path.join(context.rootState.root, 'profiles', id);
            const diagnoseVersionTask = Version.diagnoseTask(mcversion, location);
            const diagnosis = await context.dispatch('task/execute', diagnoseVersionTask);
            context.commit('diagnose', diagnosis);
        },
    },
};

export default mod;
