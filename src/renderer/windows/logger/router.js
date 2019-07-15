import Router from 'vue-router';
import Vue from 'vue';

Vue.use(Router);

const router = new Router({
    routes: [
        {
            path: '/',
            component: () => import('./Logger'),
        },
    ],
});


export default router;
