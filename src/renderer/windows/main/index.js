import select from 'universal/store.client';
import i18n from 'universal/i18n';
import Vue from 'vue';
import VueParticles from 'vue-particles';
import router from './router';
import VersionMenu from './VersionMenu';
import start from '../../start';

Vue.use(VueParticles);
Vue.component('version-menu', VersionMenu);

const store = select({ modules: ['user', 'profile', 'version', 'resource'] });

start({
    router,
    store,
    i18n: i18n(store),
});
