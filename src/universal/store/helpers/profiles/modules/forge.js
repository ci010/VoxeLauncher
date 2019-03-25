import Vue from 'vue';

export default {
    namespaced: true,
    state: () => ({
        mods: [],
        version: '',
    }),
    getters: {
        selected: state => state.mods,
        version: state => state.version,
    },
    mutations: {
        version(state, version) { state.version = version; },
        add(state, mod) {
            if (mod instanceof Array) {
                state.mods.push(...mod);
            } else { state.mods.push(mod); }
        },
        remove(state, mod) {
            Vue.delete(state.mods, state.mods.indexOf(mod));
        },
        error(state) {
            const errors = [];
            if (state.mods.length !== 0 && !state.version) {
                errors.push('');
            }
            return errors; 
        },
    },
    actions: {
        async load(context, { id }) {
            const cfg = await context.dispatch('read', {
                path: `profiles/${id}/forge.json`,
                fallback: {},
                type: 'json',
            }, { root: true });
            if (cfg.mods) {
                context.commit('add', cfg.mods);
            }
            if (cfg.version) {
                context.commit('version', cfg.version);
            }
        },
        save(context, { mutation }) {
            const id = mutation.split('/')[1];
            const path = `profiles/${id}/forge.json`;
            return context.dispatch('write', { path, data: context.state }, { root: true });
        },
        setVersion(context, version) {
            if (context.state.version !== version) {
                context.commit('version', version);
            }
        },
        validate(context) {
            if (context.state.version === '') {
                const mcver = context.getters.mcversion;
                const rec = context.rootGetters['versions/forge/getRecommendedByMc'](mcver);
                if (!rec) throw new Error();
                context.commit('version', rec.version);
            }
        },
        add(context, mod) {
            // context.dispatch('validateForgeVersion')
            if (context.state.mods.indexOf(mod) === -1) {
                context.commit('add', mod);
            }
        },
        remove(context, mod) {
            context.commit('remove', mod);
        },
    },
};
