import Router from 'vue-router';
import Vue from 'vue';
import { remote } from 'electron';
import Main from './Main';

Vue.use(Router);

const router = new Router({
    routes: [
        {
            path: '/',
            component: Main,
            children: [
                {
                    path: '/',
                    component: () => import('./HomePage'),
                },
                {
                    path: '/profiles',
                    component: () => import('./ProfilesPage'),
                },
                {
                    path: '/profile-setting',
                    component: () => import('./ProfileSetting'),
                },
                {
                    path: '/setting',
                    component: () => import('./SettingPage'),
                },
                {
                    path: '/user',
                    component: () => import('./UserPage'),
                },
                {
                    path: '/login',
                    component: () => import('./LoginPage'),
                },
            ],
        },
    ],
});

router.beforeEach((to, from, next) => {
    const full = to.fullPath.substring(1);
    if (full.startsWith('https:') || full.startsWith('http:')) {
        remote.shell.openExternal(full);
        next(false);
    } else {
        next();
    }
});


export default router;
