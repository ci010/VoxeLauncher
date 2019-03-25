import { LiteLoader } from 'ts-minecraft';

export default {
    namespaced: true,
    state: () => ({
        mods: [],
        version: '',
        settings: {},
    }),
    getters: {
        version: state => state.version,
        mods: state => state.mods,
    },
    mutations: {
        version(state, version) { state.version = version; },
        add(state, mod) {
            state.mods.push(mod);
        },
    },
    actions: {
        async load(context, { id }) {
            const data = await context.dispatch('read', {
                path: `profiles/${id}/liteloader.json`,
                fallback: {},
                type: 'json',
            }, { root: true });
            if (data.version) context.commit('version', data.version);
            if (data.mods) {
                for (const mod of data.mods) {
                    context.commit('add', mod);
                }
            }
        },
        init(context) {
            
        },
        addMod(context, mod) {
            context.commit('add', mod);
        },
        async save(context, { mutation }) {
            const id = mutation.split('/')[1];
            await context.dispatch('write', {
                path: `profiles/${id}/liteloader.json`,
                data: {
                    mods: context.state.mods,
                    version: context.state.version,
                },
            }, { root: true });
        },
        setVersion(context, version) {
            if (context.state.version !== version) context.commit('version', version);
        },
    },
};
