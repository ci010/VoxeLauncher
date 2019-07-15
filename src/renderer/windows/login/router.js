import Router from 'vue-router';
import Vue from 'vue';

Vue.use(Router);

const router = new Router({
    routes: [
        {
            path: '/',
            redirect: '/login',
            component: () => import('./Login'),
            children: [
                {
                    path: 'login',
                    component: () => import('./LoginForm'),
                },
                {
                    path: 'setting',
                    component: () => import('./LoginSetting'),
                },
            ],
        },
    ],
});


export default router;
