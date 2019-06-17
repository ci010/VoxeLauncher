import i18n from 'universal/i18n';
import Vue from 'vue';
import VueParticles from 'vue-particles';
import select from '../../store';
import router from './router';
import './components';

import start from '../../start';

Vue.use(VueParticles);

const store = select({ modules: ['user', 'profile', 'version', 'resource'] });

start({
    router,
    store,
    i18n: i18n(store),
});
