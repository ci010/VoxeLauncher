/**
 * @type {import('./launch').LauncherModule}
 */
const mod = {
    state: {
        status: 'ready',
    },
    mutations: {
        launchStatus(state, status) {
            state.status = status;
        },
    },
};

export default mod;
