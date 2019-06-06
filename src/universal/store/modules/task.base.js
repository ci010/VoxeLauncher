import Vue from 'vue';

/**
 * @type {import('./task').TaskModule}
 */
const mod = {
    namespaced: true,
    state: {
        tree: {},
        tasks: [],

        maxLog: 20,
    },
    mutations: {
        create(state, { id, name }) {
            /**
            * @type {import('./task').TNode}
            */
            const node = {
                _internalId: id,
                name,
                total: -1,
                progress: -1,
                status: 'running',
                path: name,
                tasks: [],
                error: null,
                message: '',
            };
            state.tree[id] = node;
            state.tasks.push(state.tree[id]);
        },
        prune(state) {
            /**
             * 
             * @param {import('./task').TNode} task 
             */
            function remove(task) {
                if (task.tasks && task.tasks.length !== 0) {
                    task.tasks.forEach(remove);
                }
                Vue.delete(state.tree, task._internalId);
            }
            if (state.tasks.length > state.maxLog) {
                for (const task of state.tasks.slice(state.maxLog, state.tasks.length - state.maxLog)) {
                    remove(task);
                }

                state.tasks = [...state.tasks.slice(0, state.maxLog)];
            }
        },
        hook(state, { id, task }) {
            const idToNode = state.tree;
            const local = { ...task, tasks: [], errors: [] };
            state.tasks.unshift(local);
            idToNode[id] = local;
        },
        $update(state, {
            adds, childs, updates, statuses,
        }) {
            const idToNode = state.tree;
            for (const add of adds) {
                const { id, node } = add;
                const local = { ...node, tasks: [], errors: [] };
                state.tasks.unshift(local);
                idToNode[id] = local;
            }
            for (const child of childs) {
                const { id, node } = child;
                const local = { ...node, tasks: [], errors: [] };
                if (!idToNode[id]) {
                    console.log(`Cannot add child ${node._internalId} for parent ${id}.`);
                } else {
                    idToNode[id].tasks.push(local);
                    idToNode[node._internalId] = local;
                }
            }
            for (const update of Object.keys(updates).map(k => ({ id: k, ...updates[k] }))) {
                const { id, progress, total, message, time } = update;
                const task = idToNode[id];
                if (task) {
                    if (progress) task.progress = progress;
                    if (total) task.total = total;
                    if (message) task.message = message;
                    if (time) task.time = time || new Date().toLocaleTimeString();
                } else {
                    console.log(`Cannot apply update for task ${id}.`);
                }
            }
            for (const s of statuses) {
                // eslint-disable-next-line no-continue
                if (!s) { continue; }
                const { id, status } = s;
                const task = idToNode[id];
                if (task) {
                    task.status = status;
                } else {
                    console.log(`Cannot update status for task ${id}.`);
                }
            }
        },
    },
};

export default mod;
