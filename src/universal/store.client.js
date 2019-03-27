import Vuex from 'vuex';
import { remote, ipcRenderer } from 'electron';

import select from 'universal/store/selector';

export default function(option, mixin) {
    const storeOption = select(option);
    mixin = mixin || {};
    storeOption.modules = {
        ...storeOption.modules,
        ...(mixin.modules || {}),
    };
    storeOption.plugins = [
        ...(storeOption.plugins || []),
        ...(mixin.plugins || []),
    ];

    const localStore = new Vuex.Store(storeOption);
    const _commit = localStore.commit;
    const localCommit = (mutation) => {
        if (localStore._mutations[mutation.type]) {
            _commit(mutation.type, mutation.payload);
        } else {
            console.log(`discard commit ${mutation.type}`);
        }
    };

    let lastId = 0;
    let syncing = true;
    let syncingQueue = {};

    ipcRenderer.on('vuex-commit', (event, mutation, id) => {
        if (syncing) {
            syncingQueue[id] = mutation;
            return;
        }
        const newId = lastId + 1;
        if (id !== newId) {
            ipcRenderer.send('vuex-sync', lastId);
            syncing = true;
        } else {
            localCommit(mutation);
            lastId = newId;
        }
    });
    ipcRenderer.on('vuex-sync', (event, mutations, id) => {
        mutations.forEach(localCommit);
        lastId = id;
        syncing = false;

        const missing = Object.keys(syncingQueue)
            .map(k => Number.parseInt(k, 10))
            .filter(i => i > lastId);
        if (missing.length !== 0) {
            for (const key of missing) {
                console.log(syncingQueue[key]);
            }
        }
        syncingQueue = {};
    });
    ipcRenderer.send('vuex-sync', 0);

    const remoteCall = remote.require('./main');
    localStore.commit = remoteCall.commit;
    localStore.dispatch = remoteCall.dispatch;
    localStore.localCommit = localCommit;

    return localStore;
}
