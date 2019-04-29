import Router from 'vue-router';
import Vue from 'vue';

Vue.use(Router);

const router = new Router({
    routes: [
        {
            path: '/',
            component: () => import('./Root'),
            children: [
                {
                    path: '/',
                    component: () => import('./Profile'),
                },
                {
                    path: '/profiles',
                    component: () => import('./Profiles'),
                },
                {
                    path: '/setting',
                    component: () => import('./Setting'),
                },
                {
                    path: '/wizard',
                    component: () => import('./Wizard'),
                },
                {
                    path: '/user',
                    component: () => import('./User'),
                },
                {
                    path: '/login',
                    component: () => import('./Login'),
                },
            ],
        },
    ],
});


export default router;
