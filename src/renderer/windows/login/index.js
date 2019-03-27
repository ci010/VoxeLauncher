import select from 'universal/store.client';
import i18n from 'universal/i18n';
import router from './router';

const store = select({ modules: ['user', 'config'] });
export default {
    router,
    store,
    i18n: i18n(store),
};
