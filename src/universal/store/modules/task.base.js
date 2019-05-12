import Vue from 'vue';

/**
 * @type {import('./task').TaskModule}
 */
const mod = {
    namespaced: true,
    state: {
        tree: {},
        ids: [],

        maxLog: 20,
    },
    mutations: {
        create(state, { id, name }) {
            /**
            * @type {import('treelike-task').TaskNode}
            */
            const node = {
                name,
                total: -1,
                progress: -1,
                status: 'running',
                path: name,
                tasks: [],
                errors: [],
                message: '',
            };
            state.tree[id] = node;
            state.ids.unshift(id);
        },
        update(state, {
            id, progress, total, message,
        }) {
            const task = state.tree[id];
            if (progress) task.progress = progress;
            if (total) task.total = total;
            if (message) task.message = message;
        },
        finish(state, { id, error }) {
            const task = state.tree[id];
            task.status = error ? 'failed' : 'successed';
        },
        prune(state) {
            // const keys = Object.keys(state.tree);
            // if (keys.length > state.maxLog) {
            //     for (const key of keys.slice(state.maxLog, keys.length - state.maxLog)) {
            //         Vue.delete(state.tree, key);
            //     }
            // }
        },
        notify(state, { id, task }) {
            Vue.set(state.tree, id, Object.freeze(Object.assign({}, task)));
            const index = state.ids.indexOf(id);
            state.ids[index] = null;
            Vue.set(state.ids, index, id);
        },
        hook(state, { id, task }) {
            state.tree[id] = Object.freeze(Object.assign({}, task));
            state.ids.unshift(id);
        },
    },
};

export default mod;
