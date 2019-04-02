import Vue from 'vue';

/**
 * @type {import('./task').TaskModule}
 */
const mod = {
    namespaced: true,
    state: {
        tree: {},
        flat: {},
        running: [],
        all: [],

        _poll: -1,
    },
    getters: {
        running: state => state.running,
        all: state => state.all,
        get: state => id => state.flat[id],
    },
    mutations: {
        remove(state, id) {
            Vue.delete(state.all, state.all.indexOf(id));
            Vue.delete(state.flat, id);
        },
        update(state, { path, progress, total, status }) {
            let task = state;
            for (const p of path) task = task.flat[p];
            if (progress) task.progress = progress;
            if (total) task.total = total;
            if (status) task.description = status;
        },
        create(state, { path, name, id }) {
            let parent = state;
            for (const p of path) parent = task.tasks[p];
            const task = {
                id,
                name,
                total: -1,
                progress: -1,
                description: '',
                status: 'running',
                tasks: {},
            };
            if (parent === state) {
                state.all.push(task.id);
                state.running.push(task.id);
            }
            Vue.set(parent.flat, task.id, task);
        },
        finish(state, { path, error }) {
            let task = state;
            let parent;
            for (const p of path) {
                parent = task;
                task = task.flat[p];
            }
            task.status = error ? 'error' : 'finish';
            if (parent === state) {
                Vue.delete(state.running, state.running.indexOf(task.id));
            }
        },
        /*
         * Non-interactive update functions
         * 
         * Current algorithm might cause high IPC messaging load....
         * 
         * Maybe fix in the future
         */
        $finish(state, node) {
            Vue.delete(state.running, state.running.indexOf(node.id));

            Vue.delete(state.all, state.all.indexOf(node.id));
            state.all.push(node.id);

            Vue.set(state.flat, node.id, Object.freeze(Object.assign({}, node)));
        },
        $create(state, node) {
            state.running.push(node.id);
            state.all.push(node.id);

            Vue.set(state.flat, node.id, Object.freeze(Object.assign({}, node)));
        },
        $update(state, node) {
            Vue.delete(state.flat, node.id);
            Vue.delete(state.running, state.running.indexOf(node.id));
            Vue.delete(state.all, state.all.indexOf(node.id));

            Vue.set(state.flat, node.id, Object.freeze(Object.assign({}, node)));

            state.running.push(node.id);
            state.all.push(node.id);
        },
    },
};

export default mod;
