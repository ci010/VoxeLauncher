// @ts-nocheck
import Vue from 'vue';
import VueI18n from 'vue-i18n';
import locales from 'static/locales';

Vue.use(VueI18n);

export default function create(store) {
    const i18n = new VueI18n({
        locale: store.getters['config/locale'],
        fallbackLocale: 'en',
        messages: locales,
        missing: (locale, key, vm) => {
            // handle translation missing
        },
        silentTranslationWarn: true,
    });
    const { _t, _tc } = i18n;
    i18n._t = function (k, v, l, h, ...args) {
        const result = _t.apply(i18n, [k, v, l, h, ...args]);
        if (typeof result === 'object') {
            const fallback = result[''];
            if (fallback) { return i18n.formatter.interpolate(fallback, args[0]).join(''); }
            return k;
        }
        return result;
    };
    i18n._tc = (key,
        _locale,
        messages,
        host,
        choice, ...args) => {
        const result = _tc.apply(i18n, [
            key,
            _locale,
            messages,
            host,
            choice].concat(args));
        return result;
    };
    store.watch(state => state.config.locale, (val, oldVal) => {
        i18n.locale = val;
        console.log(`language changed ${oldVal} => ${val}`);
        // if (Object.keys(i18n.getLocaleMessage('en')).length === 0) {
        //     store.dispatch('config/getLocale', 'en').then((loc) => { i18n.setLocaleMessage('en', loc); });
        // }
        // if (Object.keys(i18n.getLocaleMessage(val)).length === 0) {
        //     store.dispatch('config/getLocale', val).then((loc) => {
        //         i18n.setLocaleMessage(val, loc);
        //         i18n.locale = val;
        //         console.log(`language changed ${oldVal} => ${val}`);
        //     });
        // } else {
        //     i18n.locale = val;
        //     console.log(`language changed ${oldVal} => ${val}`);
        // }
    });
    return i18n;
}
