import url from 'url';
import querystring from 'querystring';
import Vue from 'vue';
import Vuetify from 'vuetify';

if (!process.env.IS_WEB) {
    Vue.use(require('vue-electron'));
}
Vue.config.productionTip = false;

const { window } = querystring.parse(url.parse(document.URL).query);

Vue.use(Vuetify);

import(`./windows/${window}`)
    .then(option => new Vue({
        components: { App: require('./App').default },
        template: '<App/>',
        ...option.default,
    }).$mount('#app'));

