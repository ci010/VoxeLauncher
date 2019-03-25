import select from 'universal/store.client';
import i18n from 'universal/i18n';
import Vuex from 'vuex';
import router from './router';

const store = select({ modules: ['user'] });
export default {
    router,
    store,
    i18n: i18n(store),
};
