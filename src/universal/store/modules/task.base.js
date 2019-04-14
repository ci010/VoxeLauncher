import Vue from 'vue';

/**
 * @type {import('./task').TaskModule}
 */
const mod = {
    namespaced: true,
    state: {
        tree: {},
        running: [],
        history: [],

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
                path: '',
                tasks: [],
                errors: [],
                message: '',
            };
            state.tree[id] = node;
            state.running.push(id);
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
            Vue.delete(state.running, state.running.indexOf(id));
            state.history.push(task);
        },
        prune(state) {
            if (state.history.length > state.maxLog) {
                state.history = state.history.slice(0, state.maxLog);
            }
        },

        retire(state, id) {
            const index = state.running.indexOf(id);
            if (index === -1) return;
            Vue.delete(state.running, index);
            state.history.push(id);
        },
        notify(state, { id, task }) {
            Vue.set(state.tree, id, Object.freeze(Object.assign({}, task)));

            // notify the array also, since the object it self is freezed.
            const index = state.running.indexOf(id);
            state.running[index] = null;
            Vue.set(state.running, index, id);
        },
        hook(state, { id, task }) {
            state.tree[id] = Object.freeze(Object.assign({}, task));
            state.running.push(id);
        },
    },
};

export default mod;
