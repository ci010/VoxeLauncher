import { ipcMain } from 'electron';
import i18n from '../../i18n';

/**
 * @type {import('vuex').Plugin<any>}
 */
const plugin = (store) => {
    i18n.locale = store.getters['config/locale'];
    ipcMain.emit('locale-changed');
    store.registerModule('i18n', {
        namespaced: false,
        getters: {
            t: state => (key, ...values) => i18n.t(key, values),
            tc: state => (key, count, ...values) => i18n.tc(key, count, values),
        },
    });
    store.watch(state => state.config.locale, (val, oldVal) => {
        i18n.locale = val;
        ipcMain.emit('locale-changed');
    });
};
export default plugin;
