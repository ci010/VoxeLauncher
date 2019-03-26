import { ActionContext, Module } from 'vuex';
import { app } from 'electron';
import locales from 'locales';

/**
 * @type {import('./config').ConfigModule}
 */
const mod = {
    namespaced: true,
    state: {
        locale: '',
        locales: Object.keys(locales),
    },
    mutations: {
        locale(state, language) {
            state.locale = language;
        },
    },
    actions: {
        async load(context) {
            const data = await context.dispatch('read', { path: 'config.json', fallback: {}, type: 'json' }, { root: true });
            context.commit('locale', data.locale || app.getLocale());
        },
        save(context) {
            return context.dispatch('write', { path: 'config.json', data: JSON.stringify(context.state) }, { root: true });
        },
    },
};

export default mod;
