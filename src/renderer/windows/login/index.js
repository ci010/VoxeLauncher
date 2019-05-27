import i18n from 'universal/i18n';
import select from '../../store';
import router from './router';
import start from '../../start';

const store = select({ modules: ['user', 'config'] });
start({
    router,
    store,
    i18n: i18n(store),
});
