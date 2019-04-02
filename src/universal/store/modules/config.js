import { app } from 'electron';
import locales from 'locales';
import base from './config.base';

/**
 * @type {import('./config').ConfigModule}
 */
const mod = {
    ...base,
    actions: {
        async load(context) {
            const data = await context.dispatch('read', { path: 'config.json', fallback: {}, type: 'json' }, { root: true });
            context.commit('config', {
                locale: data.locale || app.getLocale(),
                locales: Object.keys(locales),
            });
        },
        save(context) {
            return context.dispatch('write', { path: 'config.json', data: JSON.stringify(context.state) }, { root: true });
        },

        getLocale(context, locale) {
            return Promise.resolve(locales[locale]);
        },
    },
};

export default mod;
