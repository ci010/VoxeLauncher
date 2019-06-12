import i18n from 'universal/i18n';
import Vue from 'vue';
import VueParticles from 'vue-particles';
import select from '../../store';
import router from './router';
import VersionMenu from './VersionMenu';
import ForgeVersionList from './ForgeVersionList';
import MinecraftVersionList from './MinecraftVersionList';
import start from '../../start';

Vue.use(VueParticles);
Vue.component('version-menu', VersionMenu);
Vue.component('minecraft-version-list', MinecraftVersionList);
Vue.component('forge-version-list', ForgeVersionList);

const store = select({ modules: ['user', 'profile', 'version', 'resource'] });

start({
    router,
    store,
    i18n: i18n(store),
});
