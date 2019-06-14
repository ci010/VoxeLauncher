import Vue from 'vue';
import Vuetify from 'vuetify';
import colors from 'vuetify/es5/util/colors';

import TextComponent from './TextComponent';
import SkinView from './skin/SkinView';

if (!process.env.IS_WEB) {
    Vue.use(require('vue-electron'));
}
Vue.config.productionTip = false;

Vue.use(Vuetify, {
    theme: {
        primary: colors.green,
        // secondary: colors.green,
        accent: colors.green.accent3,
    },
});

Vue.component('text-component', TextComponent);
Vue.component('skin-view', SkinView);

/**
 * 
 * @param {import('vue').ComponentOptions} option 
 */
export default function (option) {
    const App = require('./App').default;
    const vue = new Vue({
        ...option,
        render: h => h(App),
    });
    Vue.prototype.$repo = vue.$store;
    vue.$mount('#app');
}
