import { Task } from 'treelike-task';
import { ActionContext } from 'vuex';
import Vue from 'vue';
import { v4 } from 'uuid';

class TaskProxy {
    constructor(context, path) {
        this.context = context;
        this.path = path;
    }

    create(name) {
        const id = v4();
        this.context.commit('create', { path: this.path, name, id });
        return new TaskProxy(this.context, this.path.concat(id));
    }

    update(progress, total, status) {
        this.context.commit('update', { path: this.path, progress, total, status });
    }

    finish(error) {
        this.context.commit('finish', { path: this.path, error });
    }
}

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
    actions: {
        /**
         * 
         * @param {{name:string}} payload 
         */
        create(context, payload) {
            const id = v4();
            context.commit('create', { path: [], name: payload.name, id });
            return new TaskProxy(context, [id]);
        },
        /**
         * 
         * @param {Task} task 
         */
        async listen(context, task) {
            const root = task.root;
            root.tasks = {};
            root.description = '';
            context.commit('$create', root);
            const timer = setInterval(() => {
                if (root.status === 'finish') clearInterval(timer);
                context.commit('$update', root);
            }, 500);
            task.onChild((path, parent, child) => {
                child.tasks = {};
                child.description = '';
                parent.tasks[child.id] = child;
            });
            task.onFinish((path, result, node) => {
                node.status = 'finish';
                if (context.state.flat[node.id]) {
                    context.commit('$finish', root);
                    clearInterval(timer);
                }
            });
            task.onError((path, err, node) => {
                node.status = 'finish';
                if (context.state.flat[node.id]) {
                    context.commit('$finish', root);
                    clearInterval(timer);
                }
            });
            task.onUpdate((path, update, node) => {
                node.progress = update.progress;
                node.total = update.total;
                node.description = update.status;
            });
        },
    },
};

export default mod;
