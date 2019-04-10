import url from 'url';
import querystring from 'querystring';
import Vue from 'vue';
import Vuetify from 'vuetify';
import colors from 'vuetify/es5/util/colors';

if (!process.env.IS_WEB) {
    Vue.use(require('vue-electron'));
}
Vue.config.productionTip = false;

const { window } = querystring.parse(url.parse(document.URL).query);

Vue.use(Vuetify, {
    theme: {
        primary: colors.green,
        // secondary: colors.green,
        accent: colors.green.accent3,
    },
});

import(`./windows/${window}`)
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
