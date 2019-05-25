import select from 'universal/store.client';
import i18n from 'universal/i18n';
import router from './router';
import start from '../../start';

const store = select({ modules: ['user', 'config'] });
start({
    router,
    store,
    i18n: i18n(store),
});
