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

const runningMutex = {

};

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
        execute(context, task) {
            const mutex = task.root.name;
            if (runningMutex[mutex]) {
                return runningMutex[mutex];
            }
            ensureListener(context);
            const uuid = v4();
            let _internalId = 0;
            task.onChild((_, child) => {
                child._internalId = `${uuid}-${_internalId}`;
                _internalId += 1;
            });
            task.onUpdate((update, node) => {
                dirtyBag.mark(uuid);
            });
            task.onFinish((result, node) => {
                if (task.root === node) {
                    dirtyBag.clear(uuid);
                    context.commit('notify', { id: uuid, task: task.root });
                    context.commit('retire', uuid);
                    delete runningMutex[mutex];
                }
            });
            task.onError((result, node) => {
                if (task.root === node) {
                    dirtyBag.clear(uuid);
                    context.commit('notify', { id: uuid, task: task.root });
                    context.commit('retire', uuid);
                    delete runningMutex[mutex];
                }
            });
            task.root._internalId = uuid;

            context.commit('hook', { id: uuid, task: task.root });

            runningMutex[mutex] = task.execute();
            return runningMutex[mutex];
        },
    },
};

export default mod;
