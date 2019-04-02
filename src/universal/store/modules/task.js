import { Task } from 'treelike-task';
import { v4 } from 'uuid';

import base from './task.base';

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
    ...base,
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
            if (context.state._poll === -1) {
                
                return;
            }
            const root = task.root;
            root.tasks = {};
            root.description = '';
            context.commit('$create', root);
            const timer = setInterval(() => {
                if (root.status === 'finish') clearInterval(timer);
                context.commit('$update', root);
            }, 500);
            task.onChild((parent, child) => {
            });
            task.onFinish((result, node) => {
                if (context.state.flat[node.id]) {
                    context.commit('$finish', root);
                    clearInterval(timer);
                }
            });
            task.onError((err, node) => {
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
