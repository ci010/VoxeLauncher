import { Task } from 'treelike-task';
import { v4 } from 'uuid';

import base from './task.base';

class ShallowTask {
    constructor(context, id) {
        this.context = context;
        this.id = id;
    }

    update(progress, total, message) {
        this.context.commit('update', {
            id: this.id, progress, total, message,
        });
    }

    finish(error) {
        this.context.commit('finish', { id: this.id, error });
    }
}

class DirtyTasks {
    constructor() {
        this.mask = {};
        this.tasks = [];
    }

    empty() { return this.tasks.length === 0; }

    poll() {
        const id = this.tasks.pop();
        this.mask[id] = false;
        return id;
    }

    clear(id) { delete this.mask[id]; }

    mark(uuid) {
        if (!this.mask[uuid]) {
            this.mask[uuid] = true;
            this.tasks.push(uuid);
        }
    }
}

const dirtyBag = new DirtyTasks();

let updateListener = -1;
function ensureListener(context) {
    if (updateListener === -1) {
        updateListener = setInterval(() => {
            while (!dirtyBag.empty()) {
                const id = dirtyBag.poll();
                context.commit('notify', { id, task: context.state.tree[id] });
            }
        }, 500);
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
        createShallow(context, { name }) {
            const id = v4();
            context.commit('create', { name, id });
            return new ShallowTask(context, id);
        },

        /**
        * @param {Task} task 
        */
        listen(context, task) {
            ensureListener(context);
            const uuid = v4();
            task.onUpdate(() => { dirtyBag.mark(uuid); });
            task.onFinish((result, node) => {
                if (task.root === node) {
                    dirtyBag.clear(uuid);
                }
            });
            context.commit('hook', { id: uuid, task: task.root });
            return uuid;
        },
        /**
         * @param {Task} task 
         */
        execute(context, task) {
            ensureListener(context);
            const uuid = v4();
            task.onUpdate(() => { dirtyBag.mark(uuid); });
            context.commit('hook', { id: uuid, task: task.root });
            return task.execute().then((r) => {
                dirtyBag.clear(uuid);
                return r;
            });
        },
    },
};

export default mod;
