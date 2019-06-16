import i18n from 'universal/i18n';
import Vue from 'vue';
import VueParticles from 'vue-particles';
import select from '../../store';
import router from './router';
import VersionMenu from './VersionMenu';
import ForgeVersionList from './ForgeVersionList';
import LocalVersionList from './LocalVersionList';
import MinecraftVersionList from './MinecraftVersionList';
import LiteloaderVersionList from './LiteloaderVersionList';
import SearchBar from './SearchBar';

import start from '../../start';

Vue.use(VueParticles);
Vue.component('version-menu', VersionMenu);
Vue.component('minecraft-version-list', MinecraftVersionList);
Vue.component('forge-version-list', ForgeVersionList);
Vue.component('local-version-list', LocalVersionList);
Vue.component('liteloader-version-list', LiteloaderVersionList);
Vue.component('search-bar', SearchBar);


const store = select({ modules: ['user', 'profile', 'version', 'resource'] });

start({
    router,
    store,
    i18n: i18n(store),
});
