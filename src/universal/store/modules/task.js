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

class TaskWatcher {
    constructor() {
        this.listener = -1;

        this.adds = [];
        this.childs = [];
        this.updates = {};
        this.statuses = [];
    }

    add(id, node) {
        this.adds.push({
            id,
            node,
        });
    }

    update(uuid, update) {
        const last = this.updates[uuid];
        if (last) {
            this.updates[uuid] = {
                progress: last.progress || update.progress,
                total: last.total || update.total,
                message: last.message || update.message,
            };
        } else {
            this.updates[uuid] = update;
        }
    }

    child(id, node) {
        this.childs.push({
            id,
            node,
        });
    }

    status(uuid, status) {
        this.statuses.push({ id: uuid, status });
    }

    ensureListener(context) {
        if (this.listener === -1) {
            this.listener = setInterval(() => {
                if (this.adds.length !== 0 || this.childs.length !== 0 || Object.keys(this.updates).length !== 0 || this.statuses.length !== 0) {
                    context.commit('$update', {
                        adds: this.adds,
                        childs: this.childs,
                        updates: this.updates,
                        statuses: this.statuses,
                    });

                    this.adds = [];
                    this.childs = [];
                    this.updates = {};
                    this.statuses = [];
                }
            }, 500);
        }
    }
}

const taskWatcher = new TaskWatcher();

const nameToTask = {};
const idToTask = {};

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

        cancel(context, uuid) {
            const task = idToTask[uuid];
            if (task) { task.cancel(); }
        },
        wait(context, uuid) {
            const task = idToTask[uuid];
            if (!task) return Promise.resolve();
            return task.promise;
        },
        /**
        * @param {Task} task 
        */
        execute(context, task) {
            const name = task.root.name;
            if (nameToTask[name]) {
                return nameToTask[name].promise;
            }

            const translate = (node) => {
                node.localText = context.rootGetters.t(node.path, node.arguments || {});
            };

            taskWatcher.ensureListener(context);
            // dirtyBag.ensureListener(context);
            const uuid = v4();
            let _internalId = 0;
            task.onChild((parent, child) => {
                child._internalId = `${uuid}-${_internalId}`;
                _internalId += 1;

                child.time = new Date().toLocaleTimeString();
                translate(child);

                taskWatcher.child(parent._internalId, child);
            });
            task.onUpdate((update, node) => {
                // dirtyBag.mark(uuid);

                taskWatcher.update(node._internalId, update);
            });
            task.onFinish((result, node) => {
                if (task.root === node) {
                    delete nameToTask[name];
                }

                taskWatcher.status(node._internalId, 'successed');
            });
            task.onError((result, node) => {
                if (task.root === node) {
                    delete nameToTask[name];
                }

                taskWatcher.status(node._internalId, 'failed');
            });
            task.root.time = new Date().toLocaleTimeString();
            task.root._internalId = uuid;
            task.id = uuid;

            translate(task.root);

            context.commit('hook', { id: uuid, task: task.root });

            const promise = task.execute();

            task.promise = promise;

            nameToTask[name] = task;
            idToTask[uuid] = task;

            return uuid;
        },
    },
};

export default mod;
