import { app } from 'electron';
import locales from 'static/locales';
import base from './config.base';
import BaseFormatter from '../helpers/formater';

const baseFormatter = new BaseFormatter();

let currentDictionary = locales.en;
const fallbackDictionary = locales.en;
function query(key, dict = currentDictionary) {
    const path = key.split('.');
    let o;
    for (const partial of path) {
        if (dict[partial]) {
            o = dict[partial];
        } else {
            if (dict === fallbackDictionary) {
                return key;
            }
            return query(key, fallbackDictionary);
        }
    }
    if (typeof o === 'object') {
        return o[''] || key;
    }
    return o;
}

/**
 * @type {import('./config').ConfigModule}
 */
const mod = {
    ...base,
    mutations: {
        ...base.mutations,
        locale(state, language) {
            state.locale = language;
            currentDictionary = locales[language];
        },
    },
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

        t: {
            root: true,
            handler(context, payload) {
                if (typeof payload === 'string') {
                    return query(payload);
                }

                const template = query(payload.key);
                return baseFormatter.interpolate(template, payload.value);
            },
        },
    },
};

export default mod;
