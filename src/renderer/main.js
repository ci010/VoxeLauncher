import Vue from 'vue';
import Vuetify from 'vuetify';
import colors from 'vuetify/es5/util/colors';

import { ipcRenderer } from 'electron';
import TextComponent from './TextComponent';
import SkinView from './skin/SkinView';

if (!process.env.IS_WEB) {
    Vue.use(require('vue-electron'));
}
Vue.config.productionTip = false;

const search = new URLSearchParams(window.location.search);
const w = search.get('window');

const { log, warn, error } = console;
console.log = function (text, ...args) {
    ipcRenderer.send('renderer-log', text, ...args);
    log(text, ...args);
};
console.warn = function (text, ...args) {
    ipcRenderer.send('renderer-warn', text, ...args);
    warn(text, ...args);
};
console.error = function (text, ...args) {
    ipcRenderer.send('renderer-error', text, ...args);
    error(text, ...args);
};
ipcRenderer.send('renderer-setup', w);

Vue.use(Vuetify, {
    theme: {
        primary: colors.green,
        // secondary: colors.green,
        accent: colors.green.accent3,
    },
});

Vue.component('text-component', TextComponent);
Vue.component('skin-view', SkinView);

import(`./windows/${w}`)
    .then((option) => {
        const vue = new Vue({
            components: { App: require('./App').default },
            template: '<App/>',
            ...option.default,
        });
        Vue.prototype.$repo = vue.$store;
        vue.$mount('#app');
        return vue;
    });
