import locales from 'static/locales';

class Locale {
    constructor() {
        this.currentLocale = 'en';
        this.currentDictionary = locales.en;
    }

    get locale() {
        return this.currentLocale;
    }

    set locale(locale) {
        this.currentLocale = locale;
        this.currentDictionary = locales[locale];
    }

    query(key) {
        const path = key.split('.');
        let o;
        for (const partial of path) {
            o = this.currentDictionary[partial];
        }
        if (typeof o === 'object') {
            return o[''];
        }
        return o;
    }
}


// const { _t } = i18n;
// i18n._t = (k, v, l, h) => {
//     const result = _t.call(i18n, k, v, l, h);
//     if (typeof result === 'object') {
//         return result[''] || k;
//     }
//     return result;
// };

/**
 * @type {import('./i18n').I18nModule}
 */
const mod = {
    actions: {
        t(context, payload) {
            // const locale = context.rootState.config.locale;
            // if (locale !== i18n.locale) {
            //     i18n.locale = locale;
            // }
            // return i18n.t(payload.key, payload.value);
            return '';
        },
        tc(context, payload) {
            // const locale = context.rootState.config.locale;
            // if (locale !== i18n.locale) {
            //     i18n.locale = locale;
            // }
            // return i18n.tc(payload.key, payload.choise, payload.value);
            return '';
        },
    },
};

export default mod;
