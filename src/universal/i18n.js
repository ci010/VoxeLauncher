import Vue from 'vue';
import VueI18n from 'vue-i18n';

Vue.use(VueI18n);

export default function create(store) {

    const i18n = new VueI18n({
        locale: store.getters['config/locale'],
        fallbackLocale: 'en',
        messages: {},
        missing: (locale, key, vm) => {
            // handle translation missing
        },
        silentTranslationWarn: true,
    });
    console.log('create i18n');
    store.watch(state => state.config.locale, (val, oldVal) => {
        if (Object.keys(i18n.getLocaleMessage('en')).length === 0) {
            store.dispatch('config/getLocale', 'en').then((loc) => { i18n.setLocaleMessage('en', loc); });
        }
        if (Object.keys(i18n.getLocaleMessage(val)).length === 0) {
            store.dispatch('config/getLocale', val).then((loc) => {
                i18n.setLocaleMessage(val, loc);
                i18n.locale = val;
                console.log(`language changed ${oldVal} => ${val}`);
            });
        } else {
            i18n.locale = val;
            console.log(`language changed ${oldVal} => ${val}`);
        }
    });
    return i18n;
}
